---
title: "AWS VPC CIDR Blocks Explained: A Practical Guide for Cloud Engineers"
description: "Learn how to plan AWS VPC CIDR blocks and subnets correctly. Covers VPC sizing, subnet tiers, reserved IPs, multi-AZ design, and common mistakes. Includes a free CIDR calculator."
date: "2026-05-20"
author: "ToolNinja"
coverEmoji: "☁️"
tags: ["aws vpc cidr blocks", "aws cidr calculator", "vpc cidr planning", "aws subnet calculator", "aws vpc subnetting", "cidr blocks aws", "how to choose vpc cidr", "aws vpc ip address planning", "vpc subnet sizing", "aws networking cidr", "cidr notation aws", "aws vpc best practices cidr"]
relatedTools: ["cidr-calculator"]
faqs:
  - q: "What CIDR block should I use for my first AWS VPC?"
    a: "Start with 10.0.0.0/16 for production. It gives you 65,536 addresses — enough for years of growth — and leaves the entire 10.1.x.x through 10.255.x.x range for future VPCs. Avoid 192.168.0.0/16 for AWS VPCs as it's too small and commonly conflicts with on-premises networks."
  - q: "Can I change my VPC CIDR block after creation?"
    a: "You cannot change or remove the primary CIDR block. You can add up to 5 secondary CIDR blocks to an existing VPC. This is why choosing the right primary CIDR from the start is critical."
  - q: "How many subnets should I create in each VPC?"
    a: "At minimum, create subnets in 3 Availability Zones for each tier (public, private, data). That's 9 subnets for a standard three-tier architecture. Production workloads should never run in a single AZ."
  - q: "What is the maximum VPC CIDR size in AWS?"
    a: "The maximum allowed VPC IPv4 CIDR block size is /16, giving you 65,536 IP addresses. The minimum is /28, giving you 16 addresses (11 usable after AWS reserves 5)."
---

Choosing the wrong CIDR block for your AWS VPC is one of those decisions that haunts you months later. Unlike most cloud configuration mistakes, you can't simply delete and recreate a VPC CIDR — it affects every subnet, security group, route table, and peering connection in your architecture.

This guide covers everything you need to plan VPC CIDR blocks correctly the first time — including sizing, subnet tiers, reserved IPs, multi-AZ design, and the most common mistakes that trip up even experienced engineers.

---

## What is a VPC CIDR Block?

A VPC (Virtual Private Cloud) CIDR block defines the range of private IP addresses available to your AWS network. CIDR stands for Classless Inter-Domain Routing — it uses a slash notation to specify how many bits represent the network portion of an address.

For example:

- `10.0.0.0/16` — 65,536 total IP addresses (the most common VPC size)
- `10.0.0.0/24` — 256 total IP addresses
- `10.0.0.0/28` — 16 total IP addresses (minimum allowed VPC size)

When you create an AWS VPC, you must choose a CIDR block. AWS allows VPC sizes between /16 (65,536 addresses) and /28 (16 addresses). Once created, you cannot shrink or replace the primary CIDR — you can only add secondary CIDR blocks later.

---

## AWS Reserved IP Addresses Per Subnet

This is the fact that surprises most engineers during their first AWS deployment: **AWS reserves 5 IP addresses in every subnet**, not just the network and broadcast addresses you'd expect in traditional networking.

For a subnet with CIDR block `10.0.0.0/24`:

| IP Address | Reserved For |
|---|---|
| 10.0.0.0 | Network address |
| 10.0.0.1 | AWS VPC router |
| 10.0.0.2 | AWS DNS server |
| 10.0.0.3 | Reserved for future AWS use |
| 10.0.0.255 | Broadcast address (not supported in VPC) |

This means a /24 subnet gives you **251 usable IP addresses**, not 254. A /28 subnet (16 total) gives you only **11 usable addresses**.

Always factor AWS's 5 reserved addresses into your subnet sizing calculations.

---

## Choosing the Right VPC CIDR Size

### The RFC 1918 Private Ranges

AWS strongly recommends using the RFC 1918 private address ranges:

```
10.0.0.0/8      — 10.x.x.x addresses (largest range)
172.16.0.0/12   — 172.16.x.x to 172.31.x.x
192.168.0.0/16  — 192.168.x.x (smallest, avoid for AWS)
```

For AWS VPCs, `10.0.0.0/8` is the most flexible. You can carve it into multiple /16 VPCs across regions and accounts without running out of space.

### VPC Size Recommendations

| Use Case | Recommended VPC CIDR | Usable IPs |
|---|---|---|
| Production workloads | /16 | ~65,000 |
| Staging environment | /20 | ~4,000 |
| Development environment | /22 | ~1,000 |
| Small isolated service | /24 | ~250 |
| Testing only | /26 | ~60 |

**The golden rule:** Always go one size larger than you think you need. IP address space in a VPC is free — running out of addresses after deployment is an expensive migration problem.

---

## Subnet Tiers — The Three-Layer Architecture

Almost every production AWS VPC follows a three-tier subnet pattern:

### Public Subnets

Connected to an Internet Gateway. Hosts load balancers, NAT Gateways, and bastion hosts. Resources here have public IP addresses.

Typical size: /24 per Availability Zone (251 usable IPs)

### Private Subnets

No direct internet access. Hosts application servers, ECS tasks, EKS nodes, and Lambda functions. Outbound internet via NAT Gateway.

Typical size: /22 per Availability Zone (1,019 usable IPs)

### Data Subnets (Isolated)

No internet access at all — not even outbound. Hosts RDS databases, ElastiCache clusters, and other data stores. Locked down with strict security groups and NACLs.

Typical size: /24 per Availability Zone (251 usable IPs)

### Full Example — Production VPC

Starting CIDR: `10.0.0.0/16`

```
Public Subnets:
  us-east-1a — 10.0.0.0/24   (public)
  us-east-1b — 10.0.1.0/24   (public)
  us-east-1c — 10.0.2.0/24   (public)

Private Subnets:
  us-east-1a — 10.0.10.0/22  (private app)
  us-east-1b — 10.0.14.0/22  (private app)
  us-east-1c — 10.0.18.0/22  (private app)

Data Subnets:
  us-east-1a — 10.0.50.0/24  (database)
  us-east-1b — 10.0.51.0/24  (database)
  us-east-1c — 10.0.52.0/24  (database)
```

This leaves plenty of `10.0.x.x` space for future subnet tiers — EKS node groups, Lambda, PrivateLink endpoints, and more.

---

## Multi-AZ Design — The Non-Negotiable Rule

Always deploy subnets across at least 3 Availability Zones for production workloads. Each AZ should be independently functional — losing one AZ must not take down your application.

This means your VPC needs enough CIDR space for at least:

```
3 AZs × 3 subnet tiers = 9 subnets minimum for production
```

When planning your VPC CIDR, calculate for 3 AZs from day one even if you only deploy in 2 initially. Adding a third AZ later is significantly easier when you've left address space for it.

---

## VPC Peering and CIDR Overlap — The Critical Rule

If you plan to connect VPCs via VPC Peering or Transit Gateway, **CIDR blocks must never overlap**. This is the most common and most painful mistake in enterprise AWS networking.

Overlapping CIDR blocks between peered VPCs cannot be resolved without destroying and recreating VPCs — a multi-day migration in production.

### Recommended Multi-VPC CIDR Allocation

```
Production VPC:     10.0.0.0/16
Staging VPC:        10.1.0.0/16
Development VPC:    10.2.0.0/16
Shared Services:    10.3.0.0/16
Future expansion:   10.4.0.0/16 — 10.10.0.0/16 (reserved)
```

This pattern — allocating sequential /16 blocks from `10.x.0.0` — is the most common enterprise approach and leaves clear room for expansion.

---

## Common CIDR Mistakes to Avoid

### 1. Using 172.17.0.0/16 — Docker Conflict

Docker's default bridge network uses `172.17.0.0/16`. If your VPC or on-premises network uses this range, you'll have routing conflicts on any host running Docker containers. AWS explicitly warns against using `172.17.0.0/16` for VPCs.

### 2. Subnets Too Small for EKS

Kubernetes worker nodes create Elastic Network Interfaces (ENIs) with multiple IP addresses per node. A `t3.large` node can consume up to 12 IP addresses. A /24 subnet with 251 addresses might support only ~20 EKS nodes before running out. For EKS, size private subnets at /22 or larger.

### 3. Forgetting Endpoint Subnets

VPC Interface Endpoints (for PrivateLink) require an ENI in each subnet. If you're connecting to 10+ AWS services via PrivateLink across 3 AZs, that's 30+ IP addresses consumed just for endpoints.

### 4. Identical CIDRs Across Regions

If you ever plan to use AWS Transit Gateway or Direct Connect to connect VPCs across regions, overlapping CIDRs between regions will block peering. Allocate different /16 blocks per region from the start.

### 5. Ignoring Secondary CIDR Blocks

AWS allows up to 5 secondary CIDR blocks per VPC. If you're running out of IP addresses in a VPC, you can add a secondary CIDR rather than recreating the VPC. Plan for this escape hatch by keeping your primary CIDR well-organized.

---

## Quick Reference — Common VPC CIDR Patterns

```
Small SaaS startup:
  VPC: 10.0.0.0/20 (4,096 IPs)
  3 public /24 subnets
  3 private /24 subnets

Growing tech company:
  VPC: 10.0.0.0/16 (65,536 IPs)
  3 public /24 subnets
  3 private /22 subnets
  3 database /24 subnets

Large enterprise (multi-account):
  Per-account VPC: 10.x.0.0/16
  Central network account: 100.64.0.0/16
  Transit Gateway subnets: /28 per AZ per account
```

---

## Calculate Your VPC Subnets Instantly

Planning a VPC CIDR by hand is error-prone. Use ToolNinja's free [CIDR Calculator](https://toolninja.io/tools/cidr-calculator) to instantly see subnet masks, usable IP ranges, broadcast addresses, and binary breakdowns for any CIDR block — no login, no server, 100% in your browser.

Enter any CIDR notation (e.g. `10.0.0.0/24`) and instantly see:

- Network address and broadcast address
- First and last usable IP
- Total hosts and usable hosts (with AWS's 5 reserved subtracted)
- Full binary breakdown of network vs host bits
