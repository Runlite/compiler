"docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/server node:14 node app.js"  // javascript
"docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/server python:3.9-slim python script.py"  // python


//java
// for compile 
 "docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/server openjdk:17-slim javac Main.java"
// for run
"docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/server openjdk:17-slim java Main"


// docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/server gcc:latest sh -c "g++ -o output main.cpp && ./output"



///  rust 

// "docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/ rust:latest sh -c "rustc main.rs && ./main""



// typescript

// docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/ node:alpine sh -c "npm install -g typescript && tsc main.ts && node main.js"


// ruby

// docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/ruby ruby:latest sh -c "ruby main.rb"


// go
// docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/go golang:latest sh -c "go run main.go"


// php

// docker run --rm -v C:/Users/ajays/code/compyl:/app -w /app/php php:latest sh -c "php main.php"
