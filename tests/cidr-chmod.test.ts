import { describe, expect, it } from "vitest";
import { parseCidr, containsIp, relation, prefixFacts, PREFIX_USES } from "@/lib/cidr-info";
import { parseMode, COMMON_MODES, MODE_USES } from "@/lib/chmod-modes";

describe("CIDR helpers", () => {
  it("parses blocks and drops host bits", () => {
    expect(parseCidr("192.168.1.77/24")).toMatchObject({ cidr: "192.168.1.0/24", prefix: 24 });
    expect(parseCidr("10.0.0.0/33")).toBeNull();
    expect(parseCidr("300.0.0.0/8")).toBeNull();
  });

  it("IP in range", () => {
    expect(containsIp("10.0.0.0/16", "10.0.255.255")).toBe(true);
    expect(containsIp("10.0.0.0/16", "10.1.0.0")).toBe(false);
    expect(containsIp("0.0.0.0/0", "8.8.8.8")).toBe(true);
    expect(containsIp("nope", "1.1.1.1")).toBeNull();
  });

  it("overlap is nested or separate", () => {
    expect(relation("10.0.0.0/16", "10.0.128.0/20")!.relation).toBe("first-contains-second");
    expect(relation("10.0.128.0/20", "10.0.0.0/16")!.relation).toBe("second-contains-first");
    expect(relation("10.0.0.0/16", "10.1.0.0/16")!.relation).toBe("separate");
    expect(relation("10.0.0.5/24", "10.0.0.0/24")!.relation).toBe("same");
  });

  it("prefix facts match the standard table", () => {
    expect(prefixFacts(24)).toMatchObject({ mask: "255.255.255.0", wildcard: "0.0.0.255", total: 256, usable: 254, awsUsable: 251, slash24s: 1 });
    expect(prefixFacts(16)).toMatchObject({ mask: "255.255.0.0", total: 65536, awsUsable: 65531, slash24s: 256 });
    expect(prefixFacts(26).mask).toBe("255.255.255.192");
    expect(prefixFacts(31).usable).toBe(2);
    expect(prefixFacts(32)).toMatchObject({ mask: "255.255.255.255", usable: 1, awsUsable: null });
    expect(prefixFacts(0)).toMatchObject({ mask: "0.0.0.0", total: 4294967296 });
    expect(prefixFacts(20).binaryMask).toBe("11111111.11111111.11110000.00000000");
    expect(prefixFacts(29).awsUsable).toBeNull(); // AWS subnets stop at /28
  });

  it("every cheat-sheet prefix from /8 up has hand-written notes", () => {
    for (const p of [8, 12, 16, 20, 22, 24, 26, 28, 30, 32]) expect(PREFIX_USES[p]?.length).toBeGreaterThan(40);
  });
});

describe("chmod modes", () => {
  it("symbolic forms", () => {
    expect(parseMode("755")).toMatchObject({ symbolic: "rwxr-xr-x", symbolicCmd: "u=rwx,g=rx,o=rx", worldWritable: false });
    expect(parseMode("644")!.symbolic).toBe("rw-r--r--");
    expect(parseMode("600")!.symbolicCmd).toBe("u=rw,g=,o=");
    expect(parseMode("777")!.worldWritable).toBe(true);
    expect(parseMode("1777")!.symbolic).toBe("rwxrwxrwt");
    expect(parseMode("4755")).toMatchObject({ symbolic: "rwsr-xr-x", symbolicCmd: "u=rwxs,g=rx,o=rx" });
    expect(parseMode("2755")!.symbolic).toBe("rwxr-sr-x");
    expect(parseMode("4644")!.symbolic).toBe("rwSr--r--");
    expect(parseMode("888")).toBeNull();
  });

  it("every common mode parses and has a hand-written note", () => {
    for (const m of COMMON_MODES) {
      expect(parseMode(m), m).not.toBeNull();
      expect(MODE_USES[m]?.length, m).toBeGreaterThan(40);
    }
  });
});
