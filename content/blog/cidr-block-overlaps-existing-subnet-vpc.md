---
title: "CIDR Block Overlaps with Existing Subnet ? AWS VPC Fix Guide"
description: "CIDR overlap errors in AWS VPC happen when two subnets or VPCs share IP address ranges. Learn how to calculate non-overlapping CIDR blocks, detect conflicts, and plan your IP space."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "??"
tags: ["aws", "vpc", "networking", "cidr", "subnets", "devops", "ip addressing", "cidr overlap"]
relatedTools: ["cidr-calculator"]
faqs:
  - q: "What does CIDR overlap mean and why is it a problem?"
    a: "Two CIDR blocks overlap when they share one or more IP addresses. Overlapping subnets create routing ambiguity ? the network can't determine which subnet to use for a given IP ? so AWS prevents creating them."
  - q: "How do I quickly check if two CIDR blocks overlap?"
    a: "Two CIDRs overlap if one contains the other's network address. For 10.0.1.0/24 and 10.0.2.0/24: range A is 10.0.1.0-10.0.1.255, range B is 10.0.2.0-10.0.2.255 ? no overlap. For 10.0.1.0/24 and 10.0.0.0/16: the /24 range falls entirely within the /16 range ? overlap."
  - q: "What is a good CIDR block strategy for multiple VPCs?"
    a: "Use a hierarchical allocation: assign a /8 or /16 range to your organization (e.g., 10.0.0.0/8), then divide it into /16 blocks per environment (10.0.0.0/16 for prod, 10.1.0.0/16 for staging, 10.2.0.0/16 for dev). Subdivide each /16 into /24 blocks per subnet."
  - q: "Can I change a VPC's CIDR block after creation?"
    a: "You can add secondary CIDR blocks (up to 5 total) but you cannot remove or shrink the primary CIDR block. If your primary CIDR is wrong, you need to create a new VPC and migrate resources. This is why planning IP space before creating resources is critical."
---

## The Exact Error

```
The CIDR '10.0.1.0/24' conflicts with another subnet
```

Or in Terraform:
```
Error: creating EC2 Subnet: InvalidSubnet.Conflict: The CIDR '10.0.0.0/24' conflicts with another subnet.
```

Or for VPC peering:
```
InvalidVpcPeeringConnectionState: Cannot create a peering connection between VPCs with overlapping CIDR blocks
```

> Quick summary: Two subnets (or two peered VPCs) share an overlapping IP address range. AWS requires all subnets within a VPC to have non-overlapping CIDRs.

---

## Why This Error Happens

CIDR notation defines a range of IP addresses. `10.0.0.0/24` means all IPs from `10.0.0.0` to `10.0.0.255`. If you create a subnet whose CIDR shares any IP with an existing subnet, AWS rejects it.

Four root causes:

**1. Subnets in the same VPC overlap** ? Creating a second subnet with a CIDR that includes addresses already claimed.

**2. VPC peering with overlapping ranges** ? Both VPCs use `10.0.0.0/16` ? peering is impossible.

**3. On-premises network conflict** ? VPC connected to corporate network via VPN when both use the same RFC 1918 range.

**4. Copy-paste from a template** ? Reusing the same Terraform template without updating CIDR blocks per environment.

---

## Step-by-Step Diagnosis

### Step 1 ? List all existing subnets and their CIDRs

```bash
aws ec2 describe-subnets   --filters "Name=vpc-id,Values=vpc-xxxxxxxx"   --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone]'   --output table
```

### Step 2 ? Calculate the address range of your new CIDR

For `10.0.1.0/24`:
- Range: `10.0.1.0` ? `10.0.1.255`
- If any existing subnet overlaps this range, you'll get the conflict.

### Step 3 ? Check both VPCs' CIDRs for peering

```bash
aws ec2 describe-vpcs --vpc-ids vpc-aaa --query 'Vpcs[*].CidrBlock'
aws ec2 describe-vpcs --vpc-ids vpc-bbb --query 'Vpcs[*].CidrBlock'
```

---

## Solutions

### Solution 1 ? Choose a non-overlapping CIDR

```bash
# Existing subnets: 10.0.1.0/24 and 10.0.2.0/24
# New subnet ? use the next available /24:
aws ec2 create-subnet   --vpc-id vpc-xxxxxxxx   --cidr-block 10.0.3.0/24   --availability-zone us-east-1a
```

### Solution 2 ? Plan subnets across availability zones

```bash
# VPC: 10.0.0.0/16
# Public subnets:
10.0.1.0/24   # us-east-1a public
10.0.2.0/24   # us-east-1b public
# Private subnets:
10.0.11.0/24  # us-east-1a private
10.0.12.0/24  # us-east-1b private
# Database subnets:
10.0.21.0/24  # us-east-1a database
10.0.22.0/24  # us-east-1b database
```

### Solution 3 ? Fix Terraform CIDR conflicts across environments

```hcl
# prod.tfvars
vpc_cidr = "10.0.0.0/16"
subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]

# staging.tfvars
vpc_cidr = "10.1.0.0/16"
subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
```

---

## Quick Reference

| CIDR | Range | Hosts | Use case |
|---|---|---|---|
| `10.x.0.0/16` | 256 /24 subnets | 65K | One VPC per environment |
| `10.x.y.0/24` | 10.x.y.0 ? 10.x.y.255 | 254 | One subnet per AZ |
| `10.x.y.0/28` | 16 addresses | 11 | Small subnet |

---

## Prevent This Error in the Future

**1. Plan your entire IP address space before creating any resources.** Map all environments and regions, assign non-overlapping CIDRs upfront.

**2. Use a CIDR calculator** to visualize ranges and check for overlaps before creating subnets.

**3. Document your IP allocation** in a simple table and check it before adding a new VPC.

---

## Use ToolNinja to Debug Faster

The CIDR Calculator shows the full IP range, number of hosts, and network/broadcast addresses for any CIDR block. Use it to verify non-overlapping ranges before opening the AWS console.

?? **[CIDR Calculator ? toolninja.io/tools/cidr-calculator](https://toolninja.io/tools/cidr-calculator)**
