/* eslint-disable max-len */
'use strict';
const rp = require('request-promise');
const iconv = require('iconv-lite');

const headers = {
  'cookie': 'frankie=1; xtvrn=$535162$; __auc=04a7d70b1615c6a2d0c4bdb8b2d; default_ca=15_s; md=th; ref_go_back=https%3A%2F%2Fwww2.yapo.cl; acc_session=57fc2cdadacefa1f50e491110ff90131417a1ef0; __cfduid=d816887118711e17a63c5e0f1156005161529280245; stat_counter=1; sq=(null)&w=-1&cg=0&f=a',
  'Accept': '*/*',
  'Cache-Control': 'no-cache',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
};

module.exports = function(Ad) {
  Ad.scrape = function(msg, cb) {
    createAllRequests(38000)
      .then(function(response) {
        Promise.all(response)
          .then(function(responseArray) {
            Ad.create(responseArray)
              .then(function(insertedData) {
                cb(null, insertedData.length());
              });
          })
          .catch(function(error) {
            cb(error);
          });

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

  function createAllRequests(totalPages) {
    return new Promise(function(resolve, reject) {
      let allRequests = [];
      for (let i = 1; i <= totalPages; i++) {
        let filters = { o: i };
        let url = 'https://www.yapo.cl/merken/v1/listing';
        let options = {
          headers: headers,
          encoding: null,
          uri: url + '?o=' + filters.o,
        };
        let request = rp(options)
          .then(function(response) {
            let responseData = iconv.decode(response, 'iso-8859-1');
            let ads = JSON.parse(responseData).data.ads;
            Ad.create(ads);
            return JSON.parse(responseData).data.ads;
          })
          .catch(function(error) {
            return error;
          });
        allRequests.push(request);
      }
      resolve(allRequests);
    });
  }
};
