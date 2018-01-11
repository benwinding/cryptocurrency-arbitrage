'use strict';

function history(coin1, coin2) {
  alert('History graphs coming soon', coin1, coin2);
}

let checkedMarkets = {
    showAll: true,
    bittrex: true,
    cryptopia: true,
    bleutrade: true,
    poloniex: true
  };
let checkedCoins = {
    showAll: false,
    BTG: false,
    BTM: false,
    QTUM: false,
    BTS: false,
    XVC: false,
    // PLC: false
};

let addOne = true;
let getCheck = function(coinOrMarket){ return $('#check-' + coinOrMarket); } //Highest UL

function addRemoveAll(coinsOrMarkets) {
  if (coinsOrMarkets === 'markets') {
    for (let market in checkedMarkets) {
      checkedMarkets[market] = !checkedMarkets.showAll;
      console.log(checkedMarkets[market]);
      addOne = false;
      addRemoveMarket(market);
      addOne = true;
    }
    useData();
  }
  if (coinsOrMarkets === 'coins') {
    for (let coin in checkedCoins) {
      checkedCoins[coin] = !checkedCoins.showAll;
      console.log(checkedCoins[coin]);
      addOne = false;
      addRemoveCoin(coin);
      addOne = true;
    }
    useData();
  }
}

function addRemoveCoin(coin) {
  if (addOne)
    checkedCoins[coin] = !checkedCoins[coin];
  if (checkedCoins[coin]) {
    getCheck(coin).addClass('fa-check-square-o');
    getCheck(coin).removeClass('fa-square-o');
  }
  else {
    getCheck(coin).removeClass('fa-check-square-o');
    getCheck(coin).addClass('fa-square-o');
  }
  if (addOne)
    useData();
}

function addRemoveMarket(market) {
  console.log("Trying to add/remove market");
  if (addOne){
    console.log("If add one");
    checkedMarkets[market] = !checkedMarkets[market]
  }
  if (checkedMarkets[market]) {
    console.log("If add one");
    getCheck(market).addClass('fa-check-square-o');
    getCheck(market).removeClass('fa-square-o');
  }
  else {
    getCheck(market).removeClass('fa-check-square-o');
    getCheck(market).addClass('fa-square-o')
  }
  
  if (addOne) useData();
}

function remove(item, highOrLow) {
  let li = $(item).closest('li');
  let coin = li.attr("data-coin");
  let market = li.attr("data-market1");
  if (!Array.isArray(checkedCoins[coin]))
    checkedCoins[coin]= [];
  checkedCoins[coin].push(market);
  console.log("Removing item...", checkedCoins[coin]);
  useData();
}

function searchMarketsOrCoins(marketOrCoin, input) {
  input = input.toUpperCase();
  let listItems = $('#' + marketOrCoin + '-list > li');
  
  if (input === "") {
    listItems.show();
    return;
  }
  listItems.each(function () {
    let text = $(this).text().toUpperCase();
    (text.indexOf(input) >= 0) ? $(this).show() : $(this).hide();
  });
}

let useData;

$(window).load(function () {
  new WOW().init();
  
  $('.loader').hide();
  $('#header').show();
  
  let socket = io();
  
  let numberOfLoads = 0; //Number of final results loads
  let numberOfMLoads = 0; //Number of Market loadss
  
  socket.on('coinsAndMarkets', function (data) { //Function for when we get market data
    if (numberOfMLoads > 0) //Only  need to run this function once (Currently)
      return;
    let list = $('#market-list').empty(), coinList = $('#coin-list').empty();
    
    let marketSource = $("#market-list-template").html(); //Source
    let marketTemplate = Handlebars.compile(marketSource); // ^ and template for coin and market lists
    
    let coinSource = $("#coin-list-template").html(); //Source
    let coinTemplate = Handlebars.compile(coinSource); // ^ and template for coin and market lists
    
    let coinDataLen = data[1].length;
    for (let i = 0; i < coinDataLen; i++) { //Loop through coins
      let context = {coin: data[1][i]};
      let coin = context.coin;
      if (data[0][i]) {
        context.market = data[0][i][0];
        let market = context.market;
        list.append(marketTemplate(context));
        if (checkedMarkets[market] === false || checkedMarkets[market] === undefined) {
          checkedMarkets[market] = false;
          getCheck(market).removeClass('fa-check-square-o');
          getCheck(market).addClass('fa-square-o')
        }
      }
      coinList.append(coinTemplate(context));
      if (checkedCoins[coin] === undefined)
        checkedCoins[coin] = true;
      else {
        getCheck(coin).removeClass('fa-check-square-o');
        getCheck(coin).addClass('fa-square-o');
      }
    }
    numberOfMLoads++;
  });
  
  let highest = $('#highest'); //Highest UL
  let highSource = $("#high-template").html(); //Template source
  let highTemplate = Handlebars.compile(highSource); //Template
  
  let bestSource = $("#best-template").html();
  let bestTemplate = Handlebars.compile(bestSource);
  
  var data;
  
  $('#coin-search').keyup(function () {
    let value = $(this).val();
    console.log(value);
    searchMarketsOrCoins("coin", value)
  });
  $('#market-search').keyup(function () {
    let value = $(this).val();
    searchMarketsOrCoins("market", value)
  });
  $('.loadNumberInput').change(function () {
    useData();
  });
  function allowedData(lowMarket, highMarket, coinName) {
    if(!checkedMarkets[lowMarket] && !checkedMarkets[highMarket] && !checkedCoins[coinName])
      return false;
    if(!Array.isArray(checkedCoins[coinName]))
      return true;
    if(!checkedCoins[coinName].includes(lowMarket) && !checkedCoins[coinName].includes(highMarket))
      return true;
    else
      return false;
  }
  
  function getMarketLink(marketName, coinName) {
    switch(marketName.toLowerCase()) {
      case "bittrex": return "https://bittrex.com/Market/Index?MarketName=BTC-" + coinName;
      case "poloniex": return "https://poloniex.com/exchange#btc_" + coinName.toLowerCase();
      case "cryptopia": return "https://www.cryptopia.co.nz/Exchange/?market=" + coinName + "_BTC";
      case "bleutrade": return "https://bleutrade.com/exchange/" + coinName + "/BTC";
      default: return "www.d.com";
    }
  }
  
  useData = function () {
    console.log(data);
    let topN = $('.loadNumberInput').val();
    if (!topN) topN = 5;
    let highestN = 1;
    let initN = 1;
    let dataLen = data.length;
    highest.empty();  //Remove any previous data (LI) from UL
    for (let i = dataLen - initN; i >= dataLen - topN; i--) { //Loop through top 10
      let market1 = data[i].markets[0].name;
      let market2 = data[i].markets[1].name;
      let pairIndex = 0;
      let coinName = data[i].coin;

      if (!allowedData(market2, market1, coinName)
        && dataLen - topN > 0) {
        topN++;
        highestN++;
        return;
      }
      for (let j = dataLen - 1; j >= 0; j--) {
        if (
          data[j].markets[0].name === market2 //equal ...
          && data[j].markets[1].name === market1 // to opposite market
          && data[i].coin !== data[j].coin //and isnt the same coin as pair
          && data[j].coin !== 'BTC' //and isnt BTC
          && checkedCoins[data[j].coin] //and isnt remove
          && checkedCoins[data[j].coin][0] !== market1
          && checkedCoins[data[j].coin][0] !== market2) // and isnt disabled
        {
          pairIndex = j;
          break;
        }
      }
      if (pairIndex < 0)
        continue;
      let marketP = data[pairIndex];
      let marketi = data[i];
      let marketi0 = marketi.markets[0];
      let marketi1 = marketi.markets[1];
      let marketP0 = marketP.markets[0];
      let marketP1 = marketP.markets[1];
      let context = { //All required data
        coin: marketi.coin,
        diff: ((marketi.spread - 1) * 100).toFixed(3),
        market2price: (marketi1.last * 1000).toPrecision(3),
        market2: market2,
        market1price: (marketi0.last * 1000).toPrecision(3),
        market1: market1,
        market2link: getMarketLink(marketP1.name, data[i].coin),
        market1link: getMarketLink(marketP0.name, data[i].coin),
        market2volume: (marketP1.volume * 1.0).toFixed(1),
        market1volume: (marketP0.volume * 1.0).toFixed(1),
        pair: {
          coin: data[pairIndex].coin,
          diff: ((marketP.spread - 1) * 100).toFixed(3),
          market2price: (marketP1.last * 1000).toFixed(3),
          market2: marketP1.name,
          market1price: (marketP0.last * 1000).toFixed(3),
          market1: marketP0.name,
          market2link: getMarketLink(marketP1.name, data[pairIndex].coin),
          market1link: getMarketLink(marketP0.name, data[pairIndex].coin),
          market2volume: (marketP1.volume * 1.0).toFixed(1),
          market1volume: (marketP0.volume * 1.0).toFixed(1),
        },
        totalDiff: (((data[i].spread - 1) * 100) + ((data[pairIndex].spread - 1) * 100)).toFixed(2)
      };
      
      if (i === data.length - highestN) { //Add only the highest
        $('.best-pair').empty();
        let bestHTML = bestTemplate(context);
        $('.best-pair').append(bestHTML);
      }

      let html = highTemplate(context);
      highest.append(html);
      console.log("Appending...")
    }
  };
  
  let waitForMoreData;
  
  socket.on('results', function (results) {
    clearTimeout(waitForMoreData); //Every time we recieive new data clear the previous timeout so we don't loop through the data too many times unnecessarily...
    numberOfLoads++;
    if (numberOfLoads === 1) { //...unless we haven't loaded the data yet, then just run useData() immediately.
      $('.socket-loader').hide(); // Hide the preloader.gif
      $('#highest, #lowest').show(); //Show The UL
      data = results;
      useData();
    }
    else {
      waitForMoreData = setTimeout(function () {
        data = results;
        useData();
      }, 1000); //Wait a second before we run the function in case we get newer data within less than a second
    }
  });
});
