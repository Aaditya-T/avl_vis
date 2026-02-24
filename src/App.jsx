import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Info,
  BookOpen,
  Activity,
  FastForward,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// --- AVL Tree Data Structure with Unique IDs ---

class AVLNode {
  constructor(value) {
    this.id = Math.random().toString(36).substr(2, 9); // Unique ID for smooth React animations
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

class AVLTree {
  constructor() {
    this.root = null;
  }

  getHeight(node) {
    if (!node) return 0;
    return node.height;
  }

  getBalance(node) {
    if (!node) return 0;
    return this.getHeight(node.left) - this.getHeight(node.right);
  }

  async rightRotate(y, ctx) {
    let x = y.left;
    let T2 = x.right;

    ctx.setTarget(y.id);
    ctx.setHighlight(x.id);
    ctx.log(`↻ Pivoting ${y.value} right, promoting ${x.value} to root.`);

    x.right = y;
    y.left = T2;

    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;

    ctx.updateTree();
    await ctx.sleep();
    return x;
  }

  async leftRotate(x, ctx) {
    let y = x.right;
    let T2 = y.left;

    ctx.setTarget(x.id);
    ctx.setHighlight(y.id);
    ctx.log(`↺ Pivoting ${x.value} left, promoting ${y.value} to root.`);

    y.left = x;
    x.right = T2;

    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;

    ctx.updateTree();
    await ctx.sleep();
    return y;
  }

  async balanceNode(node, ctx) {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    let balance = this.getBalance(node);

    // Call update here to ensure newly inserted nodes are rendered BEFORE rebalancing logic pauses
    ctx.updateTree();

    // Only pause to explain if there's an actual imbalance
    if (balance > 1 || balance < -1) {
      ctx.setTarget(node.id);
      ctx.log(`⚠️ Node ${node.value} is unbalanced (BF: ${balance}). Rebalancing...`);
      await ctx.sleep();

      // Left Left Case
      if (balance > 1 && this.getBalance(node.left) >= 0) {
        ctx.log(`↻ Left-Left Heavy: Right Rotation on ${node.value}`);
        return await this.rightRotate(node, ctx);
      }
      // Left Right Case
      if (balance > 1 && this.getBalance(node.left) < 0) {
        ctx.log(`↻↺ Left-Right Heavy: Left Rotate ${node.left.value}, then Right Rotate ${node.value}`);
        node.left = await this.leftRotate(node.left, ctx);
        return await this.rightRotate(node, ctx);
      }
      // Right Right Case
      if (balance < -1 && this.getBalance(node.right) <= 0) {
        ctx.log(`↺ Right-Right Heavy: Left Rotation on ${node.value}`);
        return await this.leftRotate(node, ctx);
      }
      // Right Left Case
      if (balance < -1 && this.getBalance(node.right) > 0) {
        ctx.log(`↺↻ Right-Left Heavy: Right Rotate ${node.right.value}, then Left Rotate ${node.value}`);
        node.right = await this.rightRotate(node.right, ctx);
        return await this.leftRotate(node, ctx);
      }
    }
    return node;
  }

  async insert(node, value, ctx) {
    if (!node) {
      ctx.log(`Found empty spot. Inserting ${value}.`);
      let newNode = new AVLNode(value);
      ctx.setHighlight(newNode.id);
      ctx.updateTree();
      await ctx.sleep();
      return newNode;
    }

    ctx.setHighlight(node.id);
    ctx.log(`Comparing ${value} with ${node.value}...`);
    await ctx.sleep();

    if (value < node.value) {
      ctx.log(`${value} < ${node.value}, traversing left.`);
      node.left = await this.insert(node.left, value, ctx);
    } else if (value > node.value) {
      ctx.log(`${value} > ${node.value}, traversing right.`);
      node.right = await this.insert(node.right, value, ctx);
    } else {
      ctx.log(`Value ${value} already exists in the tree.`);
      return node;
    }

    return await this.balanceNode(node, ctx);
  }

  async delete(node, value, ctx) {
    if (!node) {
      ctx.log(`Value ${value} not found in the tree.`);
      return node;
    }

    ctx.setHighlight(node.id);
    ctx.log(`Searching: Comparing ${value} with ${node.value}...`);
    await ctx.sleep();

    if (value < node.value) {
      ctx.log(`${value} < ${node.value}, going left.`);
      node.left = await this.delete(node.left, value, ctx);
    } else if (value > node.value) {
      ctx.log(`${value} > ${node.value}, going right.`);
      node.right = await this.delete(node.right, value, ctx);
    } else {
      // Node found
      ctx.setTarget(node.id);
      ctx.log(`Found node ${value} to delete!`);
      await ctx.sleep();

      // Case 1 & 2: No child or 1 child
      if (!node.left || !node.right) {
        let temp = node.left ? node.left : node.right;
        if (!temp) {
          ctx.log(`Node ${value} is a leaf node. Removing it directly.`);
          ctx.setDeleting(node.id); // Trigger smooth shrink-out animation
          ctx.updateTree();
          await ctx.sleep();
          temp = node;
          node = null;
        } else {
          ctx.log(`Node ${value} has one child (${temp.value}). Replacing node with its child.`);
          ctx.setDeleting(node.id); // Trigger smooth shrink-out animation
          ctx.updateTree();
          await ctx.sleep();
          node = temp;
        }
        ctx.updateTree();
        await ctx.sleep();
      } else {
        // Case 3: Two children
        ctx.log(
          `Node ${value} has two children. Finding Inorder Successor (smallest value in right subtree).`,
        );
        await ctx.sleep();

        let temp = node.right;
        ctx.setHighlight(temp.id);
        while (temp.left != null) {
          ctx.log(`Traversing left to find smaller value...`);
          temp = temp.left;
          ctx.setHighlight(temp.id);
          await ctx.sleep();
        }

        ctx.log(`Inorder Successor is ${temp.value}. Copying value to target node.`);
        node.value = temp.value;
        ctx.updateTree();
        await ctx.sleep();

        ctx.log(`Now recursively deleting the duplicated successor (${temp.value}) from the right subtree.`);
        node.right = await this.delete(node.right, temp.value, ctx);
      }
    }

    if (!node) return node;
    return await this.balanceNode(node, ctx);
  }

  // Synchronous versions for fast setup (Random Tree)
  insertSync(node, value) {
    if (!node) return new AVLNode(value);
    if (value < node.value) node.left = this.insertSync(node.left, value);
    else if (value > node.value) node.right = this.insertSync(node.right, value);
    else return node;

    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    let balance = this.getBalance(node);

    if (balance > 1 && value < node.left.value) return this.rightRotateSync(node);
    if (balance < -1 && value > node.right.value) return this.leftRotateSync(node);
    if (balance > 1 && value > node.left.value) {
      node.left = this.leftRotateSync(node.left);
      return this.rightRotateSync(node);
    }
    if (balance < -1 && value < node.right.value) {
      node.right = this.rightRotateSync(node.right);
      return this.leftRotateSync(node);
    }
    return node;
  }

  rightRotateSync(y) {
    let x = y.left;
    let T2 = x.right;
    x.right = y;
    y.left = T2;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    return x;
  }

  leftRotateSync(x) {
    let y = x.right;
    let T2 = y.left;
    y.left = x;
    x.right = T2;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    return y;
  }
}

const cloneNode = (node) => {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: cloneNode(node.left),
    right: cloneNode(node.right),
    height: node.height,
  };
};

// --- Main Application Component ---

export default function App() {
  const [tree] = useState(new AVLTree());
  const [tick, setTick] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [globalLogs, setGlobalLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1000); // ms delay
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [deletingNodeId, setDeletingNodeId] = useState(null);

  // Replay State
  const [historyFrames, setHistoryFrames] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const logsRef = useRef([]);
  const activeNodeIdRef = useRef(null);
  const targetNodeIdRef = useRef(null);
  const deletingNodeIdRef = useRef(null);
  const historyFramesRef = useRef([]);

  const displayedFrame = isReviewMode && historyFrames[historyIndex] ? historyFrames[historyIndex] : null;
  const displayedRoot = displayedFrame ? displayedFrame.root : tree.root;
  const displayedLogs = displayedFrame ? displayedFrame.logs : globalLogs;
  const displayedActiveNodeId = displayedFrame ? displayedFrame.activeNodeId : activeNodeId;
  const displayedTargetNodeId = displayedFrame ? displayedFrame.targetNodeId : targetNodeId;
  const displayedDeletingNodeId = displayedFrame ? displayedFrame.deletingNodeId : deletingNodeId;

  const setLogs = (nextLogs) => {
    logsRef.current = nextLogs;
    setGlobalLogs(nextLogs);
  };

  const pushLog = (msg) => {
    const nextLogs = [...logsRef.current, msg];
    setLogs(nextLogs);
  };

  const setHighlightState = (id) => {
    activeNodeIdRef.current = id;
    setActiveNodeId(id);
  };

  const setTargetState = (id) => {
    targetNodeIdRef.current = id;
    setTargetNodeId(id);
  };

  const setDeletingState = (id) => {
    deletingNodeIdRef.current = id;
    setDeletingNodeId(id);
  };

  const captureFrame = () => {
    historyFramesRef.current.push({
      root: cloneNode(tree.root),
      activeNodeId: activeNodeIdRef.current,
      targetNodeId: targetNodeIdRef.current,
      deletingNodeId: deletingNodeIdRef.current,
      logs: [...logsRef.current],
    });
  };

  const startNewHistory = () => {
    historyFramesRef.current = [];
    setHistoryFrames([]);
    setHistoryIndex(-1);
    setIsReviewMode(false);
  };

  const finalizeHistory = () => {
    const frames = [...historyFramesRef.current];
    setHistoryFrames(frames);
    if (frames.length > 0) {
      setHistoryIndex(frames.length - 1);
      setIsReviewMode(true);
    }
  };

  useEffect(() => {
    handleRandomize();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [globalLogs, historyIndex, isReviewMode]);

  // Context passed to the async tree methods
  const createContext = () => ({
    sleep: () => new Promise((resolve) => setTimeout(resolve, simSpeed)),
    log: (msg) => {
      pushLog(msg);
      captureFrame();
    },
    setHighlight: (id) => {
      setHighlightState(id);
      captureFrame();
    },
    setTarget: (id) => {
      setTargetState(id);
      captureFrame();
    },
    setDeleting: (id) => {
      setDeletingState(id);
      captureFrame();
    },
    updateTree: () => {
      setTick((t) => t + 1);
      captureFrame();
    },
  });

  const handleInsert = async (e) => {
    e?.preventDefault();
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val >= 0 && val <= 999 && !isSimulating) {
      startNewHistory();
      setIsSimulating(true);
      pushLog(`--- Action: Insert ${val} ---`);
      setInputValue("");
      captureFrame();

      const ctx = createContext();
      tree.root = await tree.insert(tree.root, val, ctx);

      setHighlightState(null);
      setTargetState(null);
      setDeletingState(null);
      setTick((t) => t + 1);
      pushLog(`Insertion of ${val} complete.`);
      captureFrame();
      finalizeHistory();
      setIsSimulating(false);
    }
  };

  const handleDelete = async () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && !isSimulating) {
      startNewHistory();
      setIsSimulating(true);
      pushLog(`--- Action: Delete ${val} ---`);
      setInputValue("");
      captureFrame();

      const ctx = createContext();
      tree.root = await tree.delete(tree.root, val, ctx);

      setHighlightState(null);
      setTargetState(null);
      setDeletingState(null);
      setTick((t) => t + 1);
      pushLog(`Deletion process for ${val} complete.`);
      captureFrame();
      finalizeHistory();
      setIsSimulating(false);
    }
  };

  const handleClear = () => {
    if (isSimulating) return;
    startNewHistory();
    tree.root = null;
    setHighlightState(null);
    setTargetState(null);
    setDeletingState(null);
    setLogs(["--- Tree Cleared ---"]);
    setTick((t) => t + 1);
  };

  const handleRandomize = () => {
    if (isSimulating) return;
    startNewHistory();
    tree.root = null;
    setHighlightState(null);
    setTargetState(null);
    setDeletingState(null);
    setLogs(["--- Generating Random Tree ---"]);
    const nums = new Set();
    while (nums.size < 7) {
      nums.add(Math.floor(Math.random() * 100));
    }
    nums.forEach((val) => {
      tree.root = tree.insertSync(tree.root, val);
    });
    setTick((t) => t + 1);
  };

  const moveHistory = (delta) => {
    setHistoryIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= historyFrames.length) return historyFrames.length - 1;
      return next;
    });
  };

  const exitReview = () => {
    setIsReviewMode(false);
  };

  const stepLabel =
    isReviewMode && historyFrames.length > 0 ? `Step ${historyIndex + 1} / ${historyFrames.length}` : "";

  // --- Layout Engine ---
  const { nodes, edges } = useMemo(() => {
    const calculatedNodes = [];
    const calculatedEdges = [];

    const traverse = (node, x, y, dx) => {
      if (!node) return;

      const balance = tree.getBalance(node);
      calculatedNodes.push({ id: node.id, val: node.value, x, y, balance });

      if (node.left) {
        // By using Left/Right specific edge keys anchored to the parent,
        // lines will smoothly pivot and stretch to their new children during a rotation!
        const edgeId = `${node.id}-L`;
        calculatedEdges.push({ id: edgeId, x1: x, y1: y, x2: x - dx, y2: y + 80 });
        traverse(node.left, x - dx, y + 80, dx * 0.55);
      }

      if (node.right) {
        const edgeId = `${node.id}-R`;
        calculatedEdges.push({ id: edgeId, x1: x, y1: y, x2: x + dx, y2: y + 80 });
        traverse(node.right, x + dx, y + 80, dx * 0.55);
      }
    };

    traverse(displayedRoot, 400, 40, 180);
    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [displayedRoot, tick]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <style>{`
        @keyframes nodePopIn {
          0% { opacity: 0; transform: scale(0.3) translateY(-20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-pop-in {
          animation: nodePopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes nodePopOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0) translateY(20px); }
        }
        .animate-pop-out {
          animation: nodePopOut 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
              <Activity className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">AVL Tree Simulator</h1>
              <p className="text-xs text-slate-400">Step-by-Step Interactive Tutorial</p>
            </div>
          </div>
          <div className="hidden items-center gap-4 text-sm text-slate-400 sm:flex">
            {isSimulating ? (
              <span className="flex animate-pulse items-center gap-1 text-amber-400">
                <Play className="h-4 w-4" /> Simulation Running...
              </span>
            ) : isReviewMode && historyFrames.length > 0 ? (
              <span className="flex items-center gap-1 text-cyan-300">
                <FastForward className="h-4 w-4" /> Reviewing {stepLabel}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" /> Ready for Input
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:p-8">
        {/* Left Column: Theory & Logs */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Theory Panel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Info className="h-5 w-5 text-indigo-400" />
              How Deletion Works
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              <p>
                Deleting a node in an AVL tree involves standard BST deletion, followed by backtracking
                to rebalance.
              </p>

              <ul className="space-y-3 border-l-2 border-slate-800 pl-3 text-xs">
                <li>
                  <strong className="mb-1 block text-white">1. Leaf Node (0 Children)</strong>
                  Simply remove the node. The parent&apos;s pointer becomes null.
                </li>
                <li>
                  <strong className="mb-1 block text-white">2. One Child</strong>
                  Remove the node and connect its parent directly to its single child.
                </li>
                <li>
                  <strong className="mb-1 block text-white">3. Two Children</strong>
                  Find the <strong>Inorder Successor</strong> (the smallest node in the right subtree).
                  Copy its value to the target node, then recursively delete the successor.
                </li>
              </ul>
            </div>
          </div>

          {/* Operation Logs */}
          <div className="flex h-72 flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-xl lg:h-auto lg:flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Step-by-Step Log
              </h2>
              {isSimulating ? (
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
              ) : isReviewMode ? (
                <span className="text-[10px] font-medium text-cyan-300">{stepLabel}</span>
              ) : null}
            </div>
            <div className="max-h-[350px] flex-1 space-y-2 overflow-y-auto rounded-b-2xl bg-slate-950/50 p-4 font-mono text-xs">
              {displayedLogs.length === 0 ? (
                <span className="italic text-slate-600">Waiting for operations...</span>
              ) : (
                displayedLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`
                    ${log.includes("--- Action") ? "mt-4 border-b border-indigo-900/30 pb-1 font-bold text-indigo-400" : ""}
                    ${log.includes("⚠️") ? "text-amber-400" : ""}
                    ${log.includes("↻") || log.includes("↺") ? "border-l-2 border-emerald-500 pl-3 text-emerald-400" : ""}
                    ${log.includes("complete.") ? "mt-2 italic text-slate-500" : ""}
                    ${
                      !log.includes("---") &&
                      !log.includes("⚠️") &&
                      !log.includes("↻") &&
                      !log.includes("↺") &&
                      !log.includes("complete.")
                        ? "text-slate-300"
                        : ""
                    }
                  `}
                  >
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Visualization & Controls */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl lg:flex-nowrap">
            <form
              onSubmit={handleInsert}
              className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap lg:w-auto"
            >
              <input
                type="number"
                min="0"
                max="999"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isSimulating}
                placeholder="Value (0-999)"
                className="w-32 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue || isSimulating}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Insert
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!inputValue || isSimulating}
                className="flex items-center gap-1 rounded-lg border border-rose-800 bg-rose-900/50 px-4 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </form>

            <div className="flex w-full items-center justify-end gap-3 lg:w-auto">
              <div className="mr-2 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400">Speed:</span>
                <select
                  value={simSpeed}
                  onChange={(e) => setSimSpeed(Number(e.target.value))}
                  disabled={isSimulating}
                  className="cursor-pointer bg-transparent text-xs text-white focus:outline-none disabled:opacity-50"
                >
                  <option value={1500}>Tutorial (Slow)</option>
                  <option value={800}>Normal</option>
                  <option value={300}>Fast</option>
                </select>
              </div>

              <button
                onClick={handleRandomize}
                disabled={isSimulating}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> Random
              </button>
              <button
                onClick={handleClear}
                disabled={isSimulating}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Replay Controls */}
          {historyFrames.length > 0 && !isSimulating && (
            <div className="rounded-2xl border border-cyan-900/60 bg-cyan-950/20 p-4 shadow-xl">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-cyan-100">
                  Replay available for last operation. {isReviewMode ? stepLabel : "Open replay to retrace."}
                </p>
                {!isReviewMode ? (
                  <button
                    onClick={() => {
                      setIsReviewMode(true);
                      setHistoryIndex(historyFrames.length - 1);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-700 bg-cyan-900/40 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-900/60"
                  >
                    <FastForward className="h-4 w-4" /> Review Last Action
                  </button>
                ) : (
                  <button
                    onClick={exitReview}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                  >
                    Exit Review
                  </button>
                )}
              </div>

              {isReviewMode && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => moveHistory(-1)}
                    disabled={historyIndex <= 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <button
                    onClick={() => moveHistory(1)}
                    disabled={historyIndex >= historyFrames.length - 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={historyFrames.length - 1}
                    value={Math.max(historyIndex, 0)}
                    onChange={(e) => setHistoryIndex(Number(e.target.value))}
                    className="h-2 w-full max-w-sm cursor-pointer accent-cyan-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* SVG Canvas Workspace */}
          <div
            className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl"
            style={{ minHeight: "550px" }}
          >
            {nodes.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <RotateCcw className="mb-4 h-12 w-12 opacity-20" />
                <p>Tree is empty.</p>
                <p className="text-sm">Insert a node to begin the tutorial.</p>
              </div>
            ) : (
              <svg
                viewBox="0 0 800 500"
                preserveAspectRatio="xMidYMin meet"
                className="h-full w-full cursor-grab active:cursor-grabbing"
              >
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(255,255,255,0.02)"
                      strokeWidth="1"
                    />
                  </pattern>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Render Edges */}
                {edges.map((edge) => (
                  <line
                    key={edge.id}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke="#475569"
                    strokeWidth="2"
                    style={{ transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
                  />
                ))}

                {/* Render Nodes */}
                {nodes.map((node) => {
                  const isActive = node.id === displayedActiveNodeId;
                  const isTarget = node.id === displayedTargetNodeId;
                  const isDeleting = node.id === displayedDeletingNodeId;

                  let strokeColor = "#6366f1"; // Default indigo
                  let strokeWidth = "3";
                  let scale = 1;

                  if (isActive) {
                    strokeColor = "#facc15"; // Yellow
                    strokeWidth = "4";
                    scale = 1.1;
                  } else if (isTarget) {
                    strokeColor = "#f43f5e"; // Red
                    strokeWidth = "4";
                    scale = 1.1;
                  }

                  return (
                    <g
                      key={node.id}
                      style={{
                        transform: `translate(${node.x}px, ${node.y}px)`,
                        transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      {/* Inner group handles the scale & pop-in/out animations without interfering with translation */}
                      <g
                        className={isDeleting ? "animate-pop-out" : "animate-pop-in"}
                        style={{
                          transform: `scale(${scale})`,
                          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          transformOrigin: "center",
                        }}
                      >
                        <circle
                          r="22"
                          fill="#1e293b"
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          filter={isActive || isTarget ? "url(#glow)" : ""}
                          className="drop-shadow-lg transition-colors duration-300"
                        />

                        <text
                          textAnchor="middle"
                          dy=".3em"
                          fill="#f8fafc"
                          fontSize="14"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {node.val}
                        </text>

                        {/* Balance Factor Indicator */}
                        <g transform="translate(18, -18)">
                          <circle r="9" fill="#334155" />
                          <text
                            textAnchor="middle"
                            dy=".3em"
                            fill="#cbd5e1"
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {node.balance > 0 ? `+${node.balance}` : node.balance}
                          </text>
                        </g>
                      </g>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Overlay Legend */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-400 backdrop-blur">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-indigo-500 bg-slate-800"></div>
                <span>Standard Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-yellow-400 bg-slate-800 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div>
                <span className="font-medium text-yellow-400">Examining / Comparing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-rose-500 bg-slate-800 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                <span className="font-medium text-rose-400">Target / Unbalanced</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
