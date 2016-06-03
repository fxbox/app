#!/bin/bash

mkdir private
openssl genrsa -aes256 -out private/ca.key.pem 4096
chmod 400 private/ca.key.pem

mkdir certs
openssl req -config openssl.cnf \
  -key private/ca.key.pem \
  -new -x509 \
  -out certs/ca.cert.pem
chmod 444 certs/ca.cert.pem


openssl genrsa -aes256 \
      -out private/localhost.key.pem 2048
chmod 400 private/localhost.key.pem


mkdir -p csr
openssl req -config openssl.cnf -key private/localhost.key.pem -new -out csr/localhost.csr.pem

mkdir -p newcerts
echo 1000 > serial
touch index.txt
openssl ca -config openssl.cnf -days 36500 -notext -md sha256 -in csr/localhost.csr.pem -out certs/localhost.cert.pem
