---
title: "CIDR Notation & Subnetting: A Practical Guide for Developers"
description: "Understand CIDR notation, subnet masks, and IP ranges. Learn how /24, /16, /8 networks work, when to use private ranges, and how to subnet for cloud and on-prem infrastructure."
date: "2026-05-02"
author: "ToolNinja"
coverEmoji: "🌐"
tags: ["cidr calculator", "subnet calculator online", "cidr notation explained", "what is /24 network", "ip subnet calculator", "cidr to ip range", "subnet mask calculator", "network address calculator", "ipv4 subnetting guide", "cidr block calculator", "what is 0.0.0.0/0", "subnetting explained"]
relatedTools: ["cidr-calculator"]
faqs:
  - q: "What does /24 mean in an IP address like 192.168.1.0/24?"
    a: "The /24 means the first 24 bits are the network portion, leaving 8 bits for hosts. This gives you 256 addresses (254 usable hosts) and corresponds to a subnet mask of 255.255.255.0."
  - q: "What is the difference between /24 and /16?"
    a: "A /24 network has 254 usable hosts. A /16 network has 65,534 usable hosts. The smaller the number after the slash, the larger the network."
  - q: "What does 0.0.0.0/0 mean?"
    a: "0.0.0.0/0 represents all possible IP addresses — the entire internet. In routing tables and firewall rules, it's the default route meaning match everything."
  - q: "How many IP addresses are in a /24 subnet?"
    a: "A /24 subnet contains 256 IP addresses total: 1 network address, 254 usable host addresses, and 1 broadcast address."
---

## What Is CIDR?

CIDR stands for **Classless Inter-Domain Routing**. It's the modern system for specifying IP address ranges, replacing the old Class A/B/C scheme. You'll see CIDR notation everywhere: AWS VPCs, Kubernetes pod networks, firewall rules, Docker networks.

A CIDR address looks like this: `192.168.1.0/24`

The number after the slash is the **prefix length** — how many bits of the address are the network portion. The rest are host bits.

---

## How the Prefix Length Works

An IPv4 address is 32 bits. If the prefix is `/24`, then:
- **24 bits** = network address (fixed)
- **8 bits** = host addresses (variable)
- **2⁸ = 256** total addresses, **254 usable** (first = network, last = broadcast)

```
192.168.1.0/24
│           │
│           └─ 24 network bits, 8 host bits
└─ Network address
```

---

## Common Prefix Lengths at a Glance

| CIDR | Subnet Mask | Total IPs | Usable Hosts | Common Use |
|------|-------------|-----------|--------------|-----------|
| /8 | 255.0.0.0 | 16,777,216 | 16,777,214 | Large ISP, Class A private (10.x.x.x) |
| /16 | 255.255.0.0 | 65,536 | 65,534 | Medium network, 172.16.0.0/16 |
| /24 | 255.255.255.0 | 256 | 254 | Small LAN, single subnet |
| /25 | 255.255.255.128 | 128 | 126 | Half of /24 |
| /26 | 255.255.255.192 | 64 | 62 | Quarter subnet |
| /27 | 255.255.255.224 | 32 | 30 | Small segment |
| /28 | 255.255.255.240 | 16 | 14 | Tiny VLAN |
| /29 | 255.255.255.248 | 8 | 6 | Point-to-point + 4 hosts |
| /30 | 255.255.255.252 | 4 | 2 | Point-to-point links |
| /32 | 255.255.255.255 | 1 | 1 (host route) | Single host, loopback |

---

## Private IP Address Ranges (RFC 1918)

These ranges are reserved for private networks and will never be routed on the public internet:

| Range | CIDR | Addresses | Common Use |
|-------|------|-----------|-----------|
| 10.0.0.0 – 10.255.255.255 | 10.0.0.0/8 | ~16.7M | Corporate LANs, AWS/GCP VPCs |
| 172.16.0.0 – 172.31.255.255 | 172.16.0.0/12 | ~1M | Docker default bridge, some VPNs |
| 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 | 65,536 | Home routers, small offices |

**Rule of thumb:** Use `10.x.x.x` for cloud infrastructure (gives you flexibility), `192.168.x.x` for local dev environments and home networks.

---

## Subnetting: Breaking a Network into Smaller Pieces

When you have a `/24` (256 IPs) and need 4 separate subnets for different teams or security zones, you **subnet** it by borrowing host bits:

```
192.168.1.0/24  →  split into 4 × /26 subnets

192.168.1.0/26    (0–63)    Hosts: 192.168.1.1–62
192.168.1.64/26   (64–127)  Hosts: 192.168.1.65–126
192.168.1.128/26  (128–191) Hosts: 192.168.1.129–190
192.168.1.192/26  (192–255) Hosts: 192.168.1.193–254
```

Each time you increase the prefix by 1, you halve the number of hosts and double the number of subnets.

---

## AWS VPC Subnetting

AWS is where most developers encounter CIDR in practice. Key rules:

- **VPC CIDR**: AWS recommends `/16` (65,536 IPs) for new VPCs — gives you room to grow
- **Subnet CIDR**: Each subnet lives in one AZ. AWS reserves 5 IPs per subnet (first 4 + last 1)
- **Minimum subnet**: `/28` (16 IPs, 11 usable after AWS's 5)

A typical 3-AZ production setup:

```
VPC: 10.0.0.0/16

Public subnets (one per AZ):
  10.0.0.0/24   us-east-1a
  10.0.1.0/24   us-east-1b
  10.0.2.0/24   us-east-1c

Private subnets (one per AZ):
  10.0.10.0/24  us-east-1a
  10.0.11.0/24  us-east-1b
  10.0.12.0/24  us-east-1c

Database subnets:
  10.0.20.0/24  us-east-1a
  10.0.21.0/24  us-east-1b
  10.0.22.0/24  us-east-1c
```

---

## Kubernetes Pod and Service Networks

Kubernetes needs non-overlapping CIDR ranges for:
- **Node IPs**: your actual server IPs (usually from your VPC)
- **Pod CIDR**: `10.244.0.0/16` (Flannel default) or `192.168.0.0/16` (Calico default)
- **Service CIDR**: `10.96.0.0/12` (kubeadm default)

The critical rule: **these three ranges must not overlap** with each other or with your VPC CIDR.

---

## Docker Network Ranges

Docker uses `172.17.0.0/16` for the default bridge network. When running many containers or integrating with corporate VPNs, collisions are common.

Fix by specifying a custom range in `/etc/docker/daemon.json`:

```json
{
  "default-address-pools": [
    { "base": "192.168.128.0/18", "size": 24 }
  ]
}
```

---

## Supernetting: Aggregating Routes

The reverse of subnetting — combining multiple networks into one summary route:

```
192.168.0.0/24
192.168.1.0/24
192.168.2.0/24
192.168.3.0/24

→ 192.168.0.0/22  (summarizes all four)
```

Used in BGP routing tables and firewall rules to reduce complexity.

---

## CIDR in Firewall Rules

```bash
# Allow SSH from your office network
iptables -A INPUT -s 203.0.113.0/28 -p tcp --dport 22 -j ACCEPT

# Block an entire /24
iptables -A INPUT -s 198.51.100.0/24 -j DROP

# AWS Security Group — allow PostgreSQL from within VPC only
Type: PostgreSQL, Source: 10.0.0.0/16
```

Using `/32` for a single host and `/0` for "anywhere" (0.0.0.0/0) are both CIDR notation.

---

## Quick Mental Math

**"How many IPs in a /X?"**

`2^(32-X)` total IPs, minus 2 for network and broadcast = usable hosts.

- /24 → 2^8 = 256 total, 254 usable
- /25 → 2^7 = 128 total, 126 usable
- /26 → 2^6 = 64 total, 62 usable
- /27 → 2^5 = 32 total, 30 usable

---

## Try It: ToolNinja CIDR Calculator

Don't do subnet math in your head. The **[ToolNinja CIDR Calculator](/tools/cidr-calculator)** shows you the network address, broadcast address, usable host range, and total IP count for any CIDR block — instantly, in your browser.
