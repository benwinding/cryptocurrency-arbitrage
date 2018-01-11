/**
 * Created by Manu Masson on 6/27/2017.
 *
 */

'use strict';

console.log('Starting app...');

const request = require('request');
const Promise = require("bluebird"); //request for pulling JSON from api. Bluebird for Promises.
const express = require('express');
const app = express();
const helmet = require('helmet');
const http = require('http').Server(app);
const io = require('socket.io')(http); // For websocket server functionality
app.use(helmet.hidePoweredBy({setTo: 'PHP/5.4.0'}));
app.use(express.static(__dirname + '/docs'));
const port = process.env.PORT || 3000;

http.listen(port, function () {
  console.log('listening on', port);
});

require('./settings.js')(); //Includes settings file.
// let db = require('./db.js'); //Includes db.js

let coinNames = [];
io.on('connection', function (socket) {
  socket.emit('coinsAndMarkets', [marketNames, coinNames]);
  socket.emit('results', results);
});

// coin_prices is an object with data on price differences between markets. = {BTC : {market1 : 2000, market2: 4000, p : 2}, } (P for percentage difference)
// results is a 2D array with coin name and percentage difference, sorted from low to high.
let coin_prices = {}, numberOfRequests = 0, results = []; // GLOBAL variables to get pushed to browser.

function getMarketData(options, coin_prices, callback) {   //GET JSON DATA
  return new Promise(function (resolve, reject) {
    request(options.URL, function (error, response, body) {
      try {
        let data = JSON.parse(body);
        console.log("Success", options.marketName);
        if (!options.marketName) {
          resolve(data);
          return;
        }
        let newCoinPrices = options.last(data, coin_prices, options.toBTCURL);
        numberOfRequests++;
        if (numberOfRequests >= 1)
          computePrices(coin_prices);
        resolve(newCoinPrices);
      } catch (error) {
        console.log("Error getting JSON response from", options.URL, error); //Throws error
        reject(error);
      }
    });
  });
}

async function computePrices(data) {
  results = [];
  
  function loopData() {
    return new Promise(function (resolve, reject) {
      if (numberOfRequests < 2)
        return;
      for (let coin in data) {
        if (Object.keys(data[coin]).length <= 1)
          continue;
        if (coinNames.includes(coin) == false)
          coinNames.push(coin);
        let arr = [];
        for (let market in data[coin]) {
          arr.push([data[coin][market], market]);
        }
        arr.sort(function (a, b) {
          return a[0] - b[0];
        });
        // Iterate through all exchanges the current coin
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            let coinAname = arr[i][1];
            let coinAdata = arr[i][0];
            let coinBname = arr[j][1];
            let coinBdata = arr[j][0];
            results.push(
              {
                coin: coin,
                spread: coinAdata.price / coinBdata.price,
                markets: [{
                  name: coinAname,
                  last: coinAdata.price,
                  volume: coinAdata.volume
                },{
                  name: coinBname,
                  last: coinBdata.price,
                  volume: coinBdata.volume
                }]
              }
            );
            
            // db.insert({
            //     coin: coin,
            //     lastSpread: coinAdata / coinBdata,
            //     market1: {
            //         name: coinAname,
            //         last: coinAdata
            //     },
            //     market2: {
            //         name: coinBname,
            //         last: coinBdata
            //     }
            // })
          }
        }
      }
      results.sort(function (a, b) {
        return a.spread - b.spread;
      });
      console.log('Finishing function...');
      resolve();
    })
  }
  await loopData();
  
  console.log("Emitting Results...");
  io.emit('results', results);
}


(async function main() {
  let arrayOfRequests = [];
  
  for (let i = 0; i < markets.length; i++) {
    arrayOfRequests.push(getMarketData(markets[i], coin_prices));
  }
  
  await Promise.all(arrayOfRequests.map(p => p.catch(e => e)))
    .then(results => computePrices(coin_prices))
    .catch(e => console.log(e));
  
  setTimeout(main, 10000);
})();
