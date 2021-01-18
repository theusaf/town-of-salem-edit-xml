// ==UserScript==
// @name         Town of Salem XML Editor
// @namespace    https://kahoot-win.com
// @version      1.0.0
// @icon         https://blankmediagames.com/TownOfSalem/favicon.ico
// @description  Edit the XML files in the web version of Town of Salem
// @author       theusaf
// @copyright    2021, Daniel Lau (https://github.com/theusaf/town-of-salem-edit-xml)
// @match        https://blankmediagames.com/TownOfSalem/
// @match        https://www.blankmediagames.com/TownOfSalem/
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

// e.target.result.xhr (.resposne = arraybuffer)
// https://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
//
// e.target.result.url ==== "https://www.blankmediagames.com/TownOfSalem/Unity/WebAssets.3.3.4/XMLData/StringTable.en-US.xml"

if (window.TOSXML_Loaded || window.parent.TOSXML_Loaded) {
  throw "[TOSXML] - Already loaded";
}
document.write("[TOSXML] - Patching Town of Salem. Please wait. If this screen stays blank for long periods of time, this userscript may not be working properly. Disable it and send a report to theusaf.");
const mainPage = new XMLHttpRequest();
mainPage.open("GET",location.href);
mainPage.send();
mainPage.onload = function(){
  let {responseText} = mainPage;
  const [scriptURL] = responseText.match(/Build\/.*?\.js/m),
    scriptRequest = new XMLHttpRequest();
  responseText = responseText.replace(" src=\"" + scriptURL + "\"","");
  scriptRequest.open("GET",scriptURL);
  scriptRequest.send();
  scriptRequest.onload = function(){
    let {responseText:scriptText} = scriptRequest;
    const code = (data)=>{
        if(data.target.result.url.match(/TownOfSalem\/Unity\/WebAssets.+?\/XMLData\/StringTable.+?\.xml/)){
          // modify!
          const encoder = new TextEncoder(),
            decoder = new TextDecoder("utf8"),
            XMLParser = new DOMParser,
            XMLText = decoder.decode(data.target.result.xhr.response),
            XMLData = XMLParser.parseFromString(XMLText,"text/xml").documentElement,
            {TOSXML_Replacements} = localStorage,
            warn = [];
          window.parent.TOSXML_Data = {
            edited: XMLData,
            original: XMLParser.parseFromString(XMLText,"text/xml").documentElement,
            warn
          };
          if(TOSXML_Replacements){
            // start modifying
            for(const i in TOSXML_Replacements){
              const item = XMLData.querySelector(`[key="${TOSXML_Replacements[i].key}"]`);
              if(!item){
                warn.push({
                  key: TOSXML_Replacements[i].key,
                  reason: "Key Missing"
                });
                continue;
              }
              const itemText = item.textContent;
              if(TOSXML_Replacements[i].original !== itemText){
                warn.push({
                  key: TOSXML_Replacements[i].key
                });
              }
              item.innerHTML = TOSXML_Replacements[i].value;
            }
            data.target.result.xhr.response = encoder.encode(XMLData.outerHTML).buffer;
          }
        }
      },
      [replaceText] = scriptText.match(/[a-z]\.target\.result\)}\)/m),
      [replaceLetter] = replaceText.match(/[a-z]/);
    scriptText = scriptText.replace(replaceText,`(()=>{
      (${code.toString()})(${replaceLetter});
      return ${replaceLetter}.target.result})()
    )})`);
    responseText = responseText.replace("<script></script>",`<script>${scriptText}</script>`);
    document.open();
    document.write(`<style>
      body{
        margin: 0;
      }
      iframe{
        border: 0;
        width: 100%;
        height: 100%;
      }
    </style>
    <iframe src="about:blank"></iframe>`);
    document.close();
    window.stop();
    const doc = document.querySelector("iframe");
    doc.contentDocument.write(responseText);
    document.title = "Town of Salem";
    const settingsDiv = document.createElement("div");
    settingsDiv.id = "TOSXML_Main";
    settingsDiv.innerHTML = `<style>
      #TOSXML_Main{
        position: fixed;
        bottom: 0;
        left: 0;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 0.5rem;
        border-radius: 0.5rem;
        max-height: 100%;
        overflow: auto;
      }
      #TOSXML_Main:hover{
        background: black;
      }
    </style>
    <details>
      <summary>TOSXML 1.0.0 @theusaf</summary>
      <div id="TOSXML_Container">
        <div id="TOSXML_AllKeys">
          <span>All Keys</span>
          <div></div>
        </div>
        <div id="TOSXML_SavedEdits">
          <span>Your Edits</span>
          <div></div>
        </div>
        <div id="TOSXML_EditWarnings">
          <span>Warnings</span>
          <div></div>
        </div>
      </div>
    </details>`;
    document.body.append(settingsDiv);
  };
};
