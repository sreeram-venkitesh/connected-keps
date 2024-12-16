import fetch from 'node-fetch';
import fs from "fs";
import path from "path"
import url from "url"

const response = 
  await fetch('https://storage.googleapis.com/k8s-keps/keps.json', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHTTPRequest'
      } 
  })

const body = await response.text();

const data = JSON.parse(body)

const construct_kep_readme_urls = (data) => {
  for(var kep in data){
    data[kep]["readmeUrl"] = `https://raw.githubusercontent.com/kubernetes/enhancements/master/keps/${data[kep].owningSig}/${data[kep].name}/README.md`; 
  }
}

construct_kep_readme_urls(data)

const downloadReadmes = async () => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const dir = path.join(__dirname, "kep-readmes");
  await fs.mkdir(dir, {recursive: true})

  for(var kep in data){
    try {
      const response = await fetch(data[kep].readmeUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHTTPRequest'
          } 
      });
      const filename = path.join(dir, `${data[kep].name}.md`);
      const kepreadme = await response.text()
      await fs.writeFile(filename, kepreadme);
    } catch(error) {
      console.error(`Failed to download README for ${data[kep].name}:`, error);
    }
  }
}

const getKEPReadme = kep => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const readmePath = path.join(__dirname, `kep-readmes/${kep.name}.md`);
  const markdown = fs.readFileSync(readmePath, {encoding: "utf-8"});
  return markdown
}

const citationMap = {};

const parseCitations = (markdown, parentKepNumber) => {
  const kepRegexes = [
    /KEP-?(\d+)/gi,           // KEP-1234, KEP-1234
    /KEP #(\d+)/gi,           // KEP #1234
    /KEP (\d+)(?!\S)/gi,      // KEP 1234 (ensuring no additional characters follow)
    /https:\/\/github\.com\/kubernetes\/enhancements\/issues\/(\d+)/gi  // GitHub issues link
  ];

  const citations = new Set();
  
  kepRegexes.forEach(regex => {
    const matches = markdown.matchAll(regex);
    for (const match of matches) {
      const kepNumber = match[1];
      if (kepNumber) citations.add(kepNumber);
    }
    citations.delete(parentKepNumber)
    citationMap[parentKepNumber] = Array.from(citations)
  });
}

for(var kep in data){
  try{
    parseCitations(getKEPReadme(data[kep]), data[kep].kepNumber)
  } catch (err){
    console.error(err)
  }
}

const generateMapData = async citationMap => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const dir = path.join(__dirname, "..", "public");
  
  const filename = path.join(dir, "data.json");
  fs.writeFileSync(filename, JSON.stringify(citationMap), "utf-8");
}

generateMapData(citationMap);

// downloadReadmes()
