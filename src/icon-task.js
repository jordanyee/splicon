/* jshint node:true, esversion: 6 */
'use strict';

const DefaultIcons  = require('./default-icons');
const RasterizeList = require('./utils/rasterize-list');
const SaveCdvXML    = require('./utils/save-cordova-xml');
const MakeDir       = require('./utils/make-dir');
const SerializeIcon = require('./utils/serialize-icon');
const ValidPlatform = require('./utils/validate-platforms');

const RSVP          = require('rsvp');
const chalk         = require('chalk');
const existsSync    = require('fs').existsSync;
const normalizePath = require('path').normalize;
const _defaults     = require('lodash').defaults;
const _forOwn       = require('lodash').forOwn;
const _union        = require('lodash').union;

const getPlatformSizes = function(platforms) {
  let platformSizes = [];

  if (platforms.length === 0 || platforms.indexOf('all') > -1) {
    platforms = ['ios', 'android', 'windows', 'blackberry'];
  }

  platforms.forEach((platform) => {
    platformSizes[platform] = DefaultIcons[platform];
  });

  return platformSizes;
};

const abort = function(msg) {
  console.log(chalk.red(`${msg}. Aborting`));
  process.exit();
}

module.exports = function(opts) {
  return new RSVP.Promise((resolve) => {
    if (opts === undefined) opts = {};

    _defaults(opts, {
      source: 'icon.svg',
      dest: 'res/icon',
      projectPath: './cordova',
      platforms: ['all']
    });

    if (!existsSync(opts.source)) {
      abort(`Source icon ${opts.source} does not exist`);
    }

    if(!ValidPlatform(opts.platforms)) {
      abort(`Platforms ${opts.platforms} are not all valid`);
    }

    const platformSizes = getPlatformSizes(opts.platforms);
    let rasterizeQueue = [];

    _forOwn(platformSizes, (icons, platform) => {
      MakeDir('./', `${opts.projectPath}/${opts.dest}/${platform}`);

      icons.items.map((item) => {
        item.src = `${opts.dest}/${platform}/${item.name}.png`;
        item.path = normalizePath(`${opts.projectPath}/${item.src}`);
      });
      rasterizeQueue = _union(rasterizeQueue, icons.items);
    });

    RasterizeList({
      src: opts.source,
      toRasterize: rasterizeQueue
    })
    .then(SaveCdvXML({
      projectPath: opts.projectPath,
      desiredNodes: platformSizes,
      keyName: 'icon',
      serializeFn: SerializeIcon
    }))
    .then(resolve);
  });
};
