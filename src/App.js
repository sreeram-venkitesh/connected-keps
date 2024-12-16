import "./App.css";
import { Network } from "vis-network";

import { useState, useEffect } from "react";

function App() {
  const [kepData, setKepData] = useState([]);
  const [kepJson, setKepJsons] = useState({});

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        "https://storage.googleapis.com/k8s-keps/keps.json",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHTTPRequest",
          },
        }
      );

      console.log(response);
      const body = await response.text();
      const data = JSON.parse(body);
      setKepData(data);
    }

    fetchData();

    fetch(`${process.env.PUBLIC_URL}/data.json`)
      .then((r) => r.json())
      .then((r) => setKepJsons(r));
  }, []);

  useEffect(() => {
    // const groups = [
    //   { name: "sig-api-machinery", color: "#FF5733" },
    //   { name: "sig-apps", color: "#33FF57" },
    //   { name: "sig-architecture", color: "#3357FF" },
    //   { name: "sig-auth", color: "#FFFF33" },
    //   { name: "sig-autoscaling", color: "#FF33FF" },
    //   { name: "sig-cli", color: "#33FFFF" },
    //   { name: "sig-cloud-provider", color: "#FF6633" },
    //   { name: "sig-cluster-lifecycle", color: "#6633FF" },
    //   { name: "sig-docs", color: "#FF9933" },
    //   { name: "sig-contributor-experience", color: "#33CC99" },
    //   { name: "sig-etcd", color: "#FF3366" },
    //   { name: "sig-instrumentation", color: "#33CCFF" },
    //   { name: "sig-multicluster", color: "#FF33CC" },
    //   { name: "sig-network", color: "#3399FF" },
    //   { name: "sig-node", color: "#FF6600" },
    //   { name: "sig-release", color: "#66FF33" },
    //   { name: "sig-scheduling", color: "#FF3399" },
    //   { name: "sig-security", color: "#33FF99" },
    //   { name: "sig-storage", color: "#9966FF" },
    //   { name: "sig-testing", color: "#FF3366" },
    //   { name: "sig-windows", color: "#339966" },
    // ];

    var options = {
      autoResize: true,
      height: "100%",
      width: "100%",
      locale: "en",
      clickToUse: false,
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

    // Add a node for each SIG
    //   var mynetwork = document.getElementById("graph");
    //   var x = -mynetwork?.clientWidth / 2 - 1400;
    //   var y = -mynetwork?.clientHeight / 2;
    //   var step = 70;
    //   groups.forEach((sig, index) => {
    //     nodes.push({
    //       id: index + 1,
    //       x: x,
    //       y: y + index * step,
    //       label: sig.name,
    //       group: sig.name,
    //       value: 5, // Default value, can adjust based on your needs
    //       fixed: true
    //     });
    //   });

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

    network.on("stabilizationProgress", function (params) {
      document.getElementById("heading").innerHTML = "Loading...";
    });
    network.once("stabilizationIterationsDone", function () {
      document.getElementById("heading").innerText = "KEP Citation Visualizer";
    });
  }, [kepData]);

  if (!kepData || !Object.keys(kepData).length) {
    return (
      <div className="h-full px-10 py-5">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-10 py-5">
      <div className="flex justify-between">
        <h1 id="heading">Connected KEPs!</h1>
        <h1>Data last updated: December 16th, 2024</h1>
      </div>
      <div id="graph" className="flex-grow border border-black"></div>
    </div>
  );
}

export default App;
