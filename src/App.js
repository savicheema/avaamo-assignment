import React from "react";
import "./App.css";

// import { text } from "./text";

// TODO: fetch document
// TODO: find count of words
// TODO: for top 10 frequennt words do the lookups
// TODO: show the results in table

class App extends React.Component {
  render() {
    let { isTextLoaded, wordsList } = this.state;
    console.log(" App STATE", isTextLoaded);

    return (
      <div className="App">
        <div className="word">
          <div className="text">Word</div>
          <div className="count">Count</div>
          <div className="count">Pos</div>
          <div className="synonyms">synonyms</div>
        </div>
        {wordsList.map((word, index) => {
          return (
            <div className="word" key={index}>
              <div className="text">{word.text}</div>
              <div className="count">{word.count}</div>
              <div className="count">{word.pos || "loading"}</div>
              <div className="synonyms">
                {word.synonyms &&
                  word.synonyms.map((syn) => {
                    return <div className="syn">{syn.text}</div>;
                  })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  constructor(props) {
    super(props);

    let isTextLoaded = false;
    let wordsList = [];

    this.state = { isTextLoaded, wordsList };

    (function () {
      console.log("INIT");
      var cors_api_host = "cors-anywhere.herokuapp.com";
      var cors_api_url = "https://" + cors_api_host + "/";
      var slice = [].slice;
      var origin = window.location.protocol + "//" + window.location.host;
      var open = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function () {
        var args = slice.call(arguments);
        var targetOrigin = /^https?:\/\/([^/]+)/i.exec(args[1]);
        if (
          targetOrigin &&
          targetOrigin[0].toLowerCase() !== origin &&
          targetOrigin[1] !== cors_api_host
        ) {
          args[1] = cors_api_url + args[1];
        }
        console.log("END");

        return open.apply(this, args);
      };
    })();
  }

  componentDidMount() {
    this.fetchText("http://norvig.com/big.txt")
      .then((text) => {
        console.log("Word count", text.length);
        this.makeWordDict(text).then(({ wordsDict, wordsList }) => {
          console.log("DICTIONARY", wordsDict, wordsList);
          wordsList = wordsList.sort(this.sortWords).reverse().slice(0, 9);
          this.setState({ wordsList }, () => {
            let { wordsList } = this.state;
            this.lookup(wordsList);
          });
        });
      })
      .catch(() => {
        alert("Could not fetch the text file");
      });
  }
  componentWillUnmount() {}

  lookup = (words) => {
    const lookupUrl = new URL(
      "https://dictionary.yandex.net/api/v1/dicservice.json/lookup"
    );

    // ?key=APIkey&lang=en-ru&text=time
    lookupUrl.searchParams.set(
      "key",
      "dict.1.1.20210316T030425Z.77fa4f799acf22a7.9adc4ebe3ffe8e27d229aca270e76c3d319b9745"
    );
    lookupUrl.searchParams.set("lang", "en-en");
    words.forEach((word) => {
      lookupUrl.searchParams.set("text", word.text);

      fetch(lookupUrl)
        .then((response) => response.json())
        .then((data) => {
          console.log("LOOKUP DATA", data);
          if (!data.def.length) return;
          word.pos = data.def[0].pos;
          word.synonyms = data.def[0].tr;

          this.setState({ wordsList: words });
        });
    });
  };

  makeWordDict = (text) => {
    return new Promise(function (resolve, reject) {
      const allLines = text.split("\n");
      const wordsDict = {};
      const wordsList = [];

      for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i].replace(/[^a-zA-Z ]/g, "");

        const wordsInLine = line.split(" ");
        for (let j = 0; j < wordsInLine.length; j++) {
          const word = wordsInLine[j].toLowerCase();
          if (word in wordsDict) wordsDict[word].count += 1;
          else {
            // const exclude = [
            //   "the",
            //   "of",
            //   "and",
            //   "i",
            //   "his",
            //   "a",
            //   "to",
            //   "in",
            //   "he",
            //   "was",
            //   "you",
            //   "my",
            //   "that",
            //   "it",
            //   "had",
            //   "with",
            //   "by",
            //   "as",
            // ];
            // if (!word || exclude.includes(word)) continue;
            if (!word) continue;
            wordsDict[word] = {};
            wordsDict[word].count = 1;
            wordsDict[word].text = word;
            wordsList.push(wordsDict[word]);
          }
        }
      }

      resolve({ wordsDict, wordsList });
    });
  };

  fetchText = (url) => {
    var cors_api_url = "https://cors-anywhere.herokuapp.com/";

    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open("GET", cors_api_url + url);
      x.onload = function () {
        // console.log("RESULT", x.responseText);
        resolve(x.responseText);
      };
      x.onerror = function () {
        reject();
      };
      x.send();
    });
  };

  sortWords = (first, second) => {
    if (first.count < second.count) return -1;
    if (first.count > second.count) return 1;
    return 0;
  };
}
export default App;
