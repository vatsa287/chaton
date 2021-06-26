// const nodeRSA = require('node-rsa');
const CryptoJS = require('crypto-js');


// const key = new nodeRSA({b:1024});
// let publickey  = key.exportKey('public');
// let privatekey = key.exportKey('private');
// console.log(publickey);
// console.log(privatekey);

// let str = "Hello";
// let public_key = new nodeRSA(publickey);
// let private_key = new nodeRSA(privatekey);
// console.log(public_key);
// console.log(private_key);

// if(publickey === public_key){
//     console.log("smae")
// } else console.log("different")

// let encrypted = public_key.encrypt(str, "base64");
// console.log("encrypted",encrypted);

// let decrypted = private_key.decrypt(encrypted, "utf8");
// console.log(decrypted);

// const GID = "f9b9cae4-24c0-4c7a-8ab3-3009632d2558";
// const txt = "hello"

// const cipher_msg = CryptoJS.AES.encrypt(txt, 'secret key 123').toString();

// console.log(cipher_msg)

// const decrypted_bytes  = CryptoJS.AES.decrypt(cipher_msg, 'secret key 123');
// const decrypted_message = decrypted_bytes.toString(CryptoJS.enc.Utf8);

// console.log(decrypted_message)

//RSA algorithm

console.log('RSA algorithm')

let p = 3;
let q = 11;
let n=p*q;
let t=(p-1)*(q-1);
let msg = ['h','e','l','l','o'];
let flag = 0;
let i = 0;
let j = 0;
let e = [];

console.log('P = ',p," Q = ",q," n = ",n," t = ",t)

function isPrime(num) {
	for(var i = 2; i < num; i++)
	  if(num % i === 0) return false;
	return num > 1;
  }

function findE() {
for (let i = 2; i < t; i++) {
    if(gcd(i, t) == 1){
		if(isPrime(i)) e.push(i);
	}
}
}

function gcd(a, b) {
	for (let i = 1; i <= a && i <= b; i++) {
	// check if is factor of both integers
    if( a % i == 0 && b % i == 0) {
        return i;
    }
}
}

//e = 3,5,17,257,65537
findE();

var r = e[(Math.random() * e.length) | 0];

console.log(e)

let d = (Math.pow(r, -1)) % t;
// let temp = [];
let m  = 3
console.log('e =  ',r, " d = ",d)
let en = (Math.pow(m, r)) % n;

console.log('encrypted msg ',en)

let de = (Math.pow(en, 3)) % n;

console.log('decrypted msg ',de)