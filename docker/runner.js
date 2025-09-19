process.stdin.resume();
process.stdin.setEncoding("utf8");

let input = '';
process.stdin.on("data", function(chunk) {
  input += chunk;
});
process.stdin.on("end", function() {
  eval(input);
});

