const api = "https://api.hlnames.xyz";
const publicKey = "NILB2EY-R4LUDOA-WN5G5JQ-KHAQOLA";
const registry = "0x1d9d87eBc14e71490bB87f1C39F65BDB979f3cb7";
const rpc = "https://rpc.hyperliquid.xyz/evm";
const ownerOf = "0x6352211e";
const balanceOf = "0x70a08231";
export const normalizeAddress = (address) =>
  typeof address === "string" && /^0x[\da-f]{40}$/i.test(address) ? address.toLowerCase() : null;

async function request(path, signal) {
  const response = await fetch(api + path, { headers: { "X-API-Key": publicKey }, signal, cache: "no-store" });
  if (!response.ok) {
    throw new Error(response.status === 429 ? "HL Names is rate limiting requests. Try again shortly."
      : `HL Names lookup failed (HTTP ${response.status}).`);
  }
  return response.json();
}

async function readRegistry(data, signal) {
  const response = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "eth_call",
      params: [{ to: registry, data }, "latest"],
    }),
    signal,
  });
  if (!response.ok) throw new Error("HyperEVM ownership check failed. Refresh to retry.");
  const { result, error } = await response.json();
  if (error?.code === 3 && data.startsWith(ownerOf)) return null;
  if (!/^0x[\da-f]{64}$/i.test(result)) throw new Error("HyperEVM ownership check failed. Refresh to retry.");
  return result;
}

export async function ownedNames(address, signal, savedIds = []) {
  const list = await request(`/utils/names_owner/${address}`, signal);
  if (!Array.isArray(list)) throw new Error("HL Names returned an unexpected owner list.");
  const candidates = list.map((item) => item?.namehash).concat(savedIds);
  const ids = [...new Set(candidates.filter((id) => typeof id === "string" && /^0x[\da-f]{64}$/i.test(id))
    .map((id) => id.toLowerCase()))];
  const active = [];
  let next = 0;
  let found = 0;
  await Promise.all(Array.from({ length: Math.min(ids.length, 5) }, async () => {
    while (next < ids.length) {
      const id = ids[next++];
      const { name: record } = await request(`/records/full_record/${id}`, signal);
      const expiry = Number(record?.expiry);
      if (normalizeAddress(record?.owner) !== address) continue;
      if (expiry > Date.now() / 1000 && typeof record.name === "string" && /\.hl$/i.test(record.name)) {
        const owner = await readRegistry(ownerOf + id.slice(2), signal);
        if (!owner || normalizeAddress("0x" + owner.slice(-40)) !== address) continue;
        active.push({ id, name: record.name, expiry });
      }
      found++;
    }
  }));
  const balance = await readRegistry(balanceOf + address.slice(2).padStart(64, "0"), signal);
  return {
    names: active.sort((a,b) => a.name.localeCompare(b.name)),
    incomplete: BigInt(balance) > BigInt(found),
  };
}
