"use strict";
function sumPrimesBelow(limit) {
    const sieve = new Uint8Array(limit);
    sieve.fill(1);
    sieve[0] = 0;
    sieve[1] = 0;
    for (let i = 2; i * i < limit; i++) {
        if (sieve[i]) {
            for (let j = i * i; j < limit; j += i) {
                sieve[j] = 0;
            }
        }
    }
    let sum = 0;
    for (let i = 2; i < limit; i++) {
        if (sieve[i]) {
            sum += i;
        }
    }
    return sum;
}
const result = sumPrimesBelow(2000000);
console.log(result);
