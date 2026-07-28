import stockfish from 'stockfish';

async function run() {
  const originalLog = console.log;
  console.log = function(...args: any[]) {
    originalLog("INTERCEPTED:", ...args);
  };
  
  const engine = await stockfish();
  
  engine.postMessage = engine.postMessage || engine.sendCommand || function(cmd: string) { engine.ccall("command", null, ["string"], [cmd], {async: /^go\b/.test(cmd)}) };

  engine.postMessage("uci");
  
  setTimeout(() => process.exit(0), 1000);
}
run().catch(console.error);
