const {
  ni_hiring_init_web,
  ni_hiring_client_setup_web,
  ni_hiring_server_setup_web,
  ni_hiring_client_encrypt_web,
  ni_hiring_server_compute_web,
  ni_hiring_client_dec_share_web,
  ni_hiring_client_full_dec_web,
} = require("pz-hiring");
const pako = require("pako");

const serializeData = (data) => {
  return JSON.stringify(data, (key, value) => {
    if (typeof value === "bigint") {
      return value.toString() + "n";
    }
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === "bigint") {
          return item.toString() + "n";
        }
        return item;
      });
    }
    return value;
  });
};

console.log("each time includes both parties");

console.time("setup time");
ni_hiring_init_web(BigInt(0));
console.timeEnd("setup time");

console.time("ck_0 time");
let ck_0 = ni_hiring_client_setup_web(0, 2);
console.timeEnd("ck_0 time");

console.time("ck_1 time");
let ck_1 = ni_hiring_client_setup_web(1, 2);
console.timeEnd("ck_1 time");

console.time("Benchmarking client_key size");

// Original size for client_key
const serializedClientKey = serializeData(ck_0.client_key);
const clientKeyOriginalSize = new Blob([serializedClientKey]).size;
console.log(
  `Client key original size: ${(clientKeyOriginalSize / (1024 * 1024)).toFixed(
    5
  )} MB`
);

// Gzip size for client_key (estimated using pako library)
const clientKeyGzipSize = pako.gzip(serializedClientKey).length;
console.log(
  `Client key gzip size (estimated): ${(
    clientKeyGzipSize /
    (1024 * 1024)
  ).toFixed(2)} MB`
);

console.timeEnd("Finished benchmarking client_key size");

console.time("server_key_share size benchmark");

// Original size
const serializedKeyShare = serializeData(ck_0.server_key_share);

const originalSize = new Blob([serializedKeyShare]).size;
console.log(`Original size: ${(originalSize / (1024 * 1024)).toFixed(2)} MB`);

// Gzip size (estimated using pako library)

const gzipSize = pako.gzip(serializedKeyShare).length;
console.log(
  `Gzip size (estimated): ${(gzipSize / (1024 * 1024)).toFixed(2)} MB`
);

console.timeEnd("server_key_share size benchmark");

console.time("server setup time");
ni_hiring_server_setup_web(ck_0.server_key_share, ck_1.server_key_share);
console.timeEnd("server setup time");

console.time("jc_0_fhe time");
let jc_0_fhe = ni_hiring_client_encrypt_web(
  ck_0.client_key,
  true,
  true,
  [0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0],
  200
);
console.log(jc_0_fhe);
console.timeEnd("jc_0_fhe time");

console.time("jc_1_fhe time");
let jc_1_fhe = ni_hiring_client_encrypt_web(
  ck_1.client_key,
  false,
  true,
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0],
  150
);
console.log(jc_1_fhe);
console.timeEnd("jc_1_fhe time");

console.time("encrypted data size benchmark");

// Benchmark jc_0_fhe size
const serializedJc0Fhe = serializeData(jc_0_fhe);
const jc0FheOriginalSize = new Blob([serializedJc0Fhe]).size;
console.log(
  `jc_0_fhe original size: ${(jc0FheOriginalSize / (1024 * 1024)).toFixed(
    2
  )} MB`
);

const jc0FheGzipSize = pako.gzip(serializedJc0Fhe).length;
console.log(
  `jc_0_fhe gzip size (estimated): ${(jc0FheGzipSize / (1024 * 1024)).toFixed(
    2
  )} MB`
);

console.timeEnd("encrypted data size benchmark");

console.time("res_fhe time");
let res_fhe = ni_hiring_server_compute_web(jc_0_fhe, jc_1_fhe);
console.timeEnd("res_fhe time");

console.time("res_fhe size benchmark");

// Original size
const serializedResFhe = serializeData(res_fhe);
const fheOriginalSize = new Blob([serializedResFhe]).size;
console.log(
  `Original size: ${(fheOriginalSize / (1024 * 1024)).toFixed(2)} MB`
);

// Gzip size (estimated using pako library)
const fheGzipSize = pako.gzip(serializedResFhe).length;
console.log(
  `Gzip size (estimated): ${(fheGzipSize / (1024 * 1024)).toFixed(2)} MB`
);

console.timeEnd("res_fhe size benchmark");

console.time("res_fhe_share_0");
let res_fhe_share_0 = ni_hiring_client_dec_share_web(ck_0, res_fhe);
console.log(res_fhe_share_0);
console.timeEnd("res_fhe_share_0");

console.time("res_fhe_share_1");
let res_fhe_share_1 = ni_hiring_client_dec_share_web(ck_1, res_fhe);
console.log(res_fhe_share_1);
console.timeEnd("res_fhe_share_1");

console.time("res_fhe_full_dec");
let res = ni_hiring_client_full_dec_web(
  ck_0,
  res_fhe,
  res_fhe_share_0,
  res_fhe_share_1
);
console.timeEnd("res_fhe_full_dec");

console.log("Result", res);
