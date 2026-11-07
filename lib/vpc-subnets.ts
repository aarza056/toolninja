// AWS VPC subnet layout: lays tiers out across Availability Zones, then writes the same network as
// Terraform and CloudFormation. Addresses are plain numbers (0 … 2^32-1), as in lib/cidr-tools.
import { numToIp, parseCidr } from "@/lib/cidr-info";
import { rangeToCidrs } from "@/lib/cidr-tools";

export type TierType = "public" | "private" | "database";
export type NatMode = "none" | "single" | "per-az";

export interface VpcTier {
  name: string;
  type: TierType;
  prefix: number;
}

export interface VpcInput {
  name: string;
  cidr: string;
  azCount: number;
  /** Address room kept free in every tier so more AZs can be added later */
  spareAzs: number;
  nat: NatMode;
  tiers: VpcTier[];
}

export interface VpcSubnet {
  tier: string;
  type: TierType;
  /** 0-based position in the region's list of AZs */
  az: number;
  cidr: string;
  prefix: number;
  firstUsable: string;
  lastUsable: string;
  usable: number;
  total: number;
}

export type VpcPlan =
  | { ok: true; name: string; cidr: string; total: number; used: number; subnets: VpcSubnet[]; free: string[]; warnings: string[]; nat: NatMode }
  | { ok: false; error: string };

export const MAX_AZS = 6;
/** AWS keeps the first four addresses and the last one in every subnet */
export const AWS_RESERVED = 5;
const AZ_LETTERS = "abcdef";

export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isRfc1918 = (start: number, end: number) =>
  [
    [0x0a000000, 0x0affffff],
    [0xac100000, 0xac1fffff],
    [0xc0a80000, 0xc0a8ffff],
  ].some(([a, b]) => start >= a && end <= b);

export function planVpc(input: VpcInput): VpcPlan {
  const vpc = parseCidr(input.cidr);
  if (!vpc) return { ok: false, error: "Enter the VPC range as a CIDR block, like 10.0.0.0/16." };
  if (vpc.prefix < 16 || vpc.prefix > 28) return { ok: false, error: `AWS allows VPC ranges from /16 to /28, so ${vpc.cidr} can't be a VPC.` };
  const azCount = Math.floor(input.azCount);
  if (!(azCount >= 1 && azCount <= MAX_AZS)) return { ok: false, error: `Choose between 1 and ${MAX_AZS} Availability Zones.` };
  if (!input.tiers.length) return { ok: false, error: "Add at least one subnet tier." };

  const names = input.tiers.map((t) => slug(t.name));
  const blank = input.tiers.find((t) => !slug(t.name));
  if (blank) return { ok: false, error: "Every tier needs a name, using letters or numbers." };
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  if (dup) return { ok: false, error: `Two tiers are both called “${dup}”. Their resources would clash, so give each a different name.` };
  for (const t of input.tiers) {
    if (!(t.prefix >= 16 && t.prefix <= 28)) return { ok: false, error: `AWS subnets run from /16 to /28, so tier “${t.name}” can't be /${t.prefix}.` };
    if (t.prefix < vpc.prefix) return { ok: false, error: `Tier “${t.name}” (/${t.prefix}) is bigger than the VPC (/${vpc.prefix}).` };
  }

  // Biggest tier first, so alignment wastes as little as possible
  const order = input.tiers.map((t, i) => ({ t, i })).sort((a, b) => a.t.prefix - b.t.prefix || a.i - b.i);
  const subnets: VpcSubnet[] = [];
  const blocks: [number, number][] = [];
  const spare = Math.max(0, Math.floor(input.spareAzs) || 0);
  let next = vpc.start;
  for (const { t } of order) {
    const size = 2 ** (32 - t.prefix);
    for (let az = 0; az < azCount + spare; az++) {
      const start = Math.ceil(next / size) * size;
      if (start + size - 1 > vpc.end) {
        const needed = order.reduce((n, o) => n + (azCount + spare) * 2 ** (32 - o.t.prefix), 0);
        return { ok: false, error: `This doesn't fit: the tiers need about ${needed.toLocaleString("en-US")} addresses and ${vpc.cidr} has ${(vpc.end - vpc.start + 1).toLocaleString("en-US")}. Use a bigger VPC, smaller subnets, or fewer zones.` };
      }
      next = start + size;
      if (az >= azCount) continue; // room left free for this tier's future AZs
      blocks.push([start, start + size - 1]);
      subnets.push({
        tier: slug(t.name),
        type: t.type,
        az,
        cidr: `${numToIp(start)}/${t.prefix}`,
        prefix: t.prefix,
        firstUsable: numToIp(start + 4),
        lastUsable: numToIp(start + size - 2),
        usable: size - AWS_RESERVED,
        total: size,
      });
    }
  }

  const free: string[] = [];
  let cursor = vpc.start;
  blocks.forEach(([a, b]) => {
    if (a > cursor) free.push(...rangeToCidrs(cursor, a - 1));
    cursor = b + 1;
  });
  if (cursor <= vpc.end) free.push(...rangeToCidrs(cursor, vpc.end));

  const warnings: string[] = [];
  if (!isRfc1918(vpc.start, vpc.end)) warnings.push(`${vpc.cidr} isn't in a private range (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16). AWS allows it, but it can hide real internet addresses from anything in this VPC.`);
  if (vpc.start <= 0xac11ffff && vpc.end >= 0xac110000) warnings.push("AWS advises against 172.17.0.0/16 because some of its services use that range. Choose another.");
  if (azCount < 2) warnings.push("A single Availability Zone means one data center failure takes down everything. AWS load balancers and RDS Multi-AZ both need subnets in at least two.");
  const types = input.tiers.map((t) => t.type);
  if (input.nat !== "none" && !types.includes("public")) warnings.push("A NAT gateway has to sit in a public subnet and there isn't one, so it was left out of the code.");
  if (input.nat !== "none" && !types.includes("private")) warnings.push("A NAT gateway only serves private subnets and there aren't any, so it was left out of the code.");
  input.tiers.forEach((t) => {
    if (t.type === "public" && t.prefix > 27) warnings.push(`Tier “${t.name}” is /${t.prefix}. AWS load balancers need at least a /27 with 8 free addresses.`);
    if (t.type === "database" && azCount < 2) warnings.push(`Tier “${t.name}” won't get a database subnet group: RDS requires subnets in at least two zones.`);
  });

  return {
    ok: true,
    name: slug(input.name) || "main",
    cidr: vpc.cidr,
    total: vpc.end - vpc.start + 1,
    used: blocks.reduce((n, [a, b]) => n + (b - a + 1), 0),
    subnets: subnets.slice().sort((a, b) => parseCidr(a.cidr)!.start - parseCidr(b.cidr)!.start),
    free,
    warnings,
    nat: input.nat,
  };
}

type OkPlan = Extract<VpcPlan, { ok: true }>;

const hasNat = (p: OkPlan) => p.nat !== "none" && p.subnets.some((s) => s.type === "public") && p.subnets.some((s) => s.type === "private");
const tiersOf = (p: OkPlan) => Array.from(new Set(p.subnets.map((s) => s.tier)));
const azsOf = (p: OkPlan) => Array.from(new Set(p.subnets.map((s) => s.az))).sort((a, b) => a - b);
const inOrder = (p: OkPlan) => p.subnets.slice().sort((a, b) => tiersOf(p).indexOf(a.tier) - tiersOf(p).indexOf(b.tier) || a.az - b.az);
const firstPublicTier = (p: OkPlan) => p.subnets.find((s) => s.type === "public")!.tier;
const databaseTiers = (p: OkPlan) => (azsOf(p).length >= 2 ? tiersOf(p).filter((t) => p.subnets.some((s) => s.tier === t && s.type === "database")) : []);

export const azLabel = (az: number) => AZ_LETTERS[az];

// ─── Terraform ───────────────────────────────────────────────────────────────

export function vpcTerraform(p: OkPlan): string {
  const id = (s: { tier: string; az: number }) => `${s.tier.replace(/-/g, "_")}_${azLabel(s.az)}`;
  const tfName = (tier: string) => (/^[0-9]/.test(tier) ? `t_${tier}` : tier).replace(/-/g, "_");
  const sid = (s: VpcSubnet) => tfName(id(s));
  const subnets = inOrder(p);
  const nat = hasNat(p);
  const out: string[] = [];

  out.push(`# Availability Zones come from the provider's region, so this works in any region.
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = "${p.cidr}"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${p.name}"
  }
}`);

  subnets.forEach((s) => {
    out.push(`resource "aws_subnet" "${sid(s)}" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "${s.cidr}"
  availability_zone       = data.aws_availability_zones.available.names[${s.az}]
  map_public_ip_on_launch = ${s.type === "public"}

  tags = {
    Name = "${p.name}-${s.tier}-${azLabel(s.az)}"
    Tier = "${s.type}"
  }
}`);
  });

  const publics = subnets.filter((s) => s.type === "public");
  if (publics.length) {
    out.push(`resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${p.name}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${p.name}-public"
  }
}`);
    publics.forEach((s) => {
      out.push(`resource "aws_route_table_association" "${sid(s)}" {
  subnet_id      = aws_subnet.${sid(s)}.id
  route_table_id = aws_route_table.public.id
}`);
    });
  }

  const privates = subnets.filter((s) => s.type === "private");
  if (nat) {
    const tier = firstPublicTier(p);
    const natAzs = p.nat === "single" ? [0] : azsOf(p);
    out.push(`# NAT gateways are billed per hour and per GB, even when idle.`);
    natAzs.forEach((az) => {
      const a = azLabel(az);
      out.push(`resource "aws_eip" "nat_${a}" {
  domain = "vpc"

  tags = {
    Name = "${p.name}-nat-${a}"
  }
}

resource "aws_nat_gateway" "${a}" {
  allocation_id = aws_eip.nat_${a}.id
  subnet_id     = aws_subnet.${tfName(id({ tier, az }))}.id

  tags = {
    Name = "${p.name}-${a}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private_${a}" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.${a}.id
  }

  tags = {
    Name = "${p.name}-private-${a}"
  }
}`);
    });
    privates.forEach((s) => {
      out.push(`resource "aws_route_table_association" "${sid(s)}" {
  subnet_id      = aws_subnet.${sid(s)}.id
  route_table_id = aws_route_table.private_${azLabel(p.nat === "single" ? 0 : s.az)}.id
}`);
    });
  } else if (privates.length) {
    out.push(`# Private subnets use the VPC's main route table: they reach each other but not the internet.
# Choose a NAT gateway option above if they need outbound access.`);
  }

  databaseTiers(p).forEach((tier) => {
    const members = subnets.filter((s) => s.tier === tier);
    out.push(`resource "aws_db_subnet_group" "${tfName(tier)}" {
  name       = "${p.name}-${tier}"
  subnet_ids = [${members.map((s) => `aws_subnet.${sid(s)}.id`).join(", ")}]

  tags = {
    Name = "${p.name}-${tier}"
  }
}`);
  });

  return out.join("\n\n") + "\n";
}

// ─── CloudFormation ──────────────────────────────────────────────────────────

export function vpcCloudFormation(p: OkPlan): string {
  const pascal = (tier: string) =>
    tier
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");
  const sid = (s: { tier: string; az: number }) => `${pascal(s.tier)}Subnet${azLabel(s.az).toUpperCase()}`;
  const subnets = inOrder(p);
  const nat = hasNat(p);
  const tag = (name: string) => `      Tags:
        - Key: Name
          Value: "${name}"`;
  const out: string[] = [];

  out.push(`AWSTemplateFormatVersion: "2010-09-09"
Description: ${p.name} VPC and subnets

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: ${p.cidr}
      EnableDnsSupport: true
      EnableDnsHostnames: true
${tag(p.name)}`);

  subnets.forEach((s) => {
    out.push(`  ${sid(s)}:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: ${s.cidr}
      AvailabilityZone: !Select [${s.az}, !GetAZs ""]
      MapPublicIpOnLaunch: ${s.type === "public"}
${tag(`${p.name}-${s.tier}-${azLabel(s.az)}`)}`);
  });

  const publics = subnets.filter((s) => s.type === "public");
  if (publics.length) {
    out.push(`  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
${tag(p.name)}

  GatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
${tag(`${p.name}-public`)}

  PublicDefaultRoute:
    Type: AWS::EC2::Route
    DependsOn: GatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway`);
    publics.forEach((s) => {
      out.push(`  ${sid(s)}RouteTable:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ${sid(s)}
      RouteTableId: !Ref PublicRouteTable`);
    });
  }

  const privates = subnets.filter((s) => s.type === "private");
  if (nat) {
    const tier = firstPublicTier(p);
    const natAzs = p.nat === "single" ? [0] : azsOf(p);
    natAzs.forEach((az) => {
      const A = azLabel(az).toUpperCase();
      out.push(`  NatEip${A}:
    Type: AWS::EC2::EIP
    DependsOn: GatewayAttachment
    Properties:
      Domain: vpc

  NatGateway${A}:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip${A}.AllocationId
      SubnetId: !Ref ${sid({ tier, az })}
${tag(`${p.name}-${azLabel(az)}`)}

  PrivateRouteTable${A}:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
${tag(`${p.name}-private-${azLabel(az)}`)}

  PrivateDefaultRoute${A}:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable${A}
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway${A}`);
    });
    privates.forEach((s) => {
      const A = azLabel(p.nat === "single" ? 0 : s.az).toUpperCase();
      out.push(`  ${sid(s)}RouteTable:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ${sid(s)}
      RouteTableId: !Ref PrivateRouteTable${A}`);
    });
  }

  databaseTiers(p).forEach((tier) => {
    const members = subnets.filter((s) => s.tier === tier);
    out.push(`  ${pascal(tier)}SubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: ${p.name} ${tier} subnets
      SubnetIds:
${members.map((s) => `        - !Ref ${sid(s)}`).join("\n")}`);
  });

  return out.join("\n\n") + "\n";
}
