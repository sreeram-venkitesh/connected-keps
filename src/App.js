import "./App.css";
import { Network } from "vis-network";

import { useState, useEffect, useRef, useCallback } from "react";

const sigGroups = [
  { name: "sig-api-machinery", color: "#FF5733" },
  { name: "sig-apps", color: "#33FF57" },
  { name: "sig-architecture", color: "#3357FF" },
  { name: "sig-auth", color: "#FFFF33" },
  { name: "sig-autoscaling", color: "#FF33FF" },
  { name: "sig-cli", color: "#33FFFF" },
  { name: "sig-cloud-provider", color: "#FF6633" },
  { name: "sig-cluster-lifecycle", color: "#6633FF" },
  { name: "sig-docs", color: "#FF9933" },
  { name: "sig-contributor-experience", color: "#33CC99" },
  { name: "sig-etcd", color: "#FF3366" },
  { name: "sig-instrumentation", color: "#33CCFF" },
  { name: "sig-multicluster", color: "#FF33CC" },
  { name: "sig-network", color: "#3399FF" },
  { name: "sig-node", color: "#FF6600" },
  { name: "sig-release", color: "#66FF33" },
  { name: "sig-scheduling", color: "#FF3399" },
  { name: "sig-security", color: "#33FF99" },
  { name: "sig-storage", color: "#9966FF" },
  { name: "sig-testing", color: "#FF3366" },
  { name: "sig-windows", color: "#339966" },
];

function App() {
  const [kepData, setKepData] = useState([]);
  const [kepJson, setKepJsons] = useState({});
  const [showLegend, setShowLegend] = useState(false);
  const [isNetworkStabilizing, setIsNetworkStabilizing] = useState(false);
  const [enabledSigs, setEnabledSigs] = useState(() =>
    sigGroups.reduce((acc, sig) => ({ ...acc, [sig.name]: true }), {})
  );

  const networkRef = useRef(null);
  const allNodesRef = useRef([]);
  const allEdgesRef = useRef([]);

  const filterNetworkData = useCallback(() => {
    if (!networkRef.current || allNodesRef.current.length === 0) return;

    const filteredNodes = allNodesRef.current.filter(node =>
      enabledSigs[node.group] !== false
    );

    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

    const filteredEdges = allEdgesRef.current.filter(edge =>
      filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to)
    );

    networkRef.current.setData({
      nodes: filteredNodes,
      edges: filteredEdges
    });
  }, [enabledSigs]);

  const toggleSig = useCallback((sigName) => {
    setEnabledSigs(prev => ({
      ...prev,
      [sigName]: !prev[sigName]
    }));
  }, []);

  useEffect(() => {


    fetch(`${process.env.PUBLIC_URL}/keps.json`)
      .then((r) => r.json())
      .then((r) => setKepData(r));

    fetch(`${process.env.PUBLIC_URL}/data.json`)
      .then((r) => r.json())
      .then((r) => setKepJsons(r));
  }, []);

  useEffect(() => {
    var options = {
      autoResize: true,
      height: "100%",
      width: "100%",
      locale: "en",
      clickToUse: false,
      groups: sigGroups.reduce((acc, sig) => {
        acc[sig.name] = { color: sig.color };
        return acc;
      }, {}),
      nodes: {
        shape: "dot",
        size: 30,
        font: {
          size: 20,
        },
      },
      edges: {
        width: 5,
      },

      physics: {
        barnesHut: {
          // gravitationalConstant: -30000,
          avoidOverlap: 1,
        },
      },
    };

    var nodes = [];
    var edges = [];

    var nodeIds = new Set();


    console.log(kepData[0]);
    kepData.forEach((element) => {
      if (element.kepNumber !== undefined) {
        const nodeId = `KEP-${element.kepNumber}`;

        if (!nodeIds.has(nodeId)) {
          const elementDiv = document.createElement("div");
          const nameParagraph = document.createElement("p");
          nameParagraph.textContent = "Name: " + element.title;
          const owningSigParagraph = document.createElement("p");
          owningSigParagraph.textContent = "SIG: " + element.owningSig;
          elementDiv.appendChild(nameParagraph);
          elementDiv.appendChild(owningSigParagraph);


          const kepno = document.createElement("p");
          kepno.textContent = "KEP Number: " + element.kepNumber;
          elementDiv.appendChild(kepno);

          const latestMilestone = document.createElement("p");
          latestMilestone.textContent =
            "Latest milestone: " + element.latestMilestone;
          elementDiv.appendChild(latestMilestone);

          const stage = document.createElement("p");
          stage.textContent = "Stage: " + element.stage;
          elementDiv.appendChild(stage);

          const authors = document.createElement("p");
          authors.textContent = "Authors: " + element.authors;
          elementDiv.appendChild(authors);

          nodes.push({
            id: `KEP-${element.kepNumber}`,
            label: element.name,
            group: element.owningSig,
            title: elementDiv,
          });
          nodeIds.add(nodeId);
        }

        if (kepJson[element.kepNumber]) {
          kepJson[element.kepNumber]?.forEach((citation) => {
            edges.push({
              from: `KEP-${element.kepNumber}`,
              to: `KEP-${citation}`,
            });
          });
        }
      }
    });

    const container = document.getElementById("graph");
    if (!container) {
      console.error("Graph container not found!");
      return;
    }

    var data = {
      nodes: nodes,
      edges: edges,
    };

    const network = new Network(container, data, options);
    networkRef.current = network;

    allNodesRef.current = nodes;
    allEdgesRef.current = edges;

    setIsNetworkStabilizing(true);

    network.once("stabilizationIterationsDone", function () {
      setIsNetworkStabilizing(false);
    });
  }, [kepData]);

  useEffect(() => {
    filterNetworkData();
  }, [enabledSigs, filterNetworkData]);

  const NetworkLoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 loading-overlay z-15">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 loading-spinner"></div>
        <p className="mt-3 text-sm font-medium text-gray-600">Loading KEPs...</p>
      </div>
    </div>
  );

  if (!kepData || !Object.keys(kepData).length) {
    return (
      <div className="h-full px-10 py-5 relative">
        <h1>Loading...</h1>
        {/* <LoadingSpinner /> */}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-10 py-5">
      <div className="flex justify-between items-center">
        <h1>KEP Citation Visualizer</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="my-3 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
          <h1>Data last updated: October 4th, 2025</h1>
        </div>
      </div>

      <div className="flex flex-grow relative">
        <div id="graph" className="flex-grow border border-black"></div>

        {isNetworkStabilizing && <NetworkLoadingSpinner />}

        {showLegend && (
          <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto z-10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg">SIGs</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setEnabledSigs(sigGroups.reduce((acc, sig) => ({ ...acc, [sig.name]: true }), {}))}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  All
                </button>
                <button
                  onClick={() => setEnabledSigs(sigGroups.reduce((acc, sig) => ({ ...acc, [sig.name]: false }), {}))}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  None
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {sigGroups.map((sig) => (
                <div key={sig.name} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSig(sig.name)}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${enabledSigs[sig.name]
                      ? 'border-gray-400'
                      : 'border-gray-600 bg-gray-300 opacity-50'
                      }`}
                    style={{
                      backgroundColor: enabledSigs[sig.name] ? sig.color : undefined
                    }}
                  />
                  <span
                    className={`text-sm cursor-pointer select-none ${enabledSigs[sig.name] ? 'text-black' : 'text-gray-500 line-through'
                      }`}
                    onClick={() => toggleSig(sig.name)}
                  >
                    {sig.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
