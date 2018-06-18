/* eslint-disable max-len */
'use strict';
const rp = require('request-promise');
const iconv = require('iconv-lite');
const PromisePool = require('es6-promise-pool');
const ProgressBar = require('progress');

const headers = {
  'cookie': 'frankie=1; xtvrn=$535162$; __auc=04a7d70b1615c6a2d0c4bdb8b2d; default_ca=15_s; md=th; ref_go_back=https%3A%2F%2Fwww2.yapo.cl; acc_session=57fc2cdadacefa1f50e491110ff90131417a1ef0; __cfduid=d816887118711e17a63c5e0f1156005161529280245; stat_counter=1; sq=(null)&w=-1&cg=0&f=a',
  'Accept': '*/*',
  'Cache-Control': 'no-cache',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
};

module.exports = function(Ad) {

  let currentPage = 0;
  let totalPages = 0;
  Ad.scrape = function(msg, cb) {
    totalPages = 10000;
    consume()
      .then(function(response) {
        cb(null, response);
      })
      .catch(function(error) {
        cb(error);
      });
  };

  Ad.remoteMethod('scrape', {
    accepts: { arg: 'msg', type: 'string' },
    returns: { arg: 'ads', type: 'object' },
  });

  Ad.getTotalPages = function(url) {
    return new Promise(function(resolve, reject) {
      let filters = { o: 1 };
      let url = 'https://www.yapo.cl/merken/v1/listing';
      let options = {
        headers: headers,
        encoding: null,
        uri: url + '?o=' + filters.o,
      };
      rp(options)
        .then(function(response) {
          let responseData = iconv.decode(response, 'iso-8859-1');
          let responseJson = JSON.parse(responseData);
          let totalPages = responseJson.meta.total_pages;
          resolve(totalPages);
        })
        .catch(function(error) {
          reject(error);
        });
    });
  };

  function consume() {
    return new Promise((resolve, reject) => {
      const pool = new PromisePool(promiseProducer, 10);
      console.log('Start: ', new Date());

      pool.start()
        .then(function(data) {
          console.log('Finish: ', new Date());
          resolve(data);
        });
    });
  }

  function promiseProducer() {
    const bar = new ProgressBar(':bar', { total: totalPages });
    if (currentPage < totalPages) {
      currentPage++;
      bar.tick();
      console.log('pagina actual', currentPage);
      return promiseRequest(currentPage);
    } else {
      return null;
    }
  }

  function promiseRequest(page) {
    let filters = { o: page };
    let url = 'https://www.yapo.cl/merken/v1/listing';
    let options = {
      headers: headers,
      encoding: null,
      uri: url + '?o=' + filters.o,
    };
    return rp(options)
      .then(function(response) {
        let responseData = iconv.decode(response, 'iso-8859-1');
        return Ad.create(JSON.parse(responseData).data.ads);
      })
      .catch(function(error) {
        return error;
      });
  }
};
