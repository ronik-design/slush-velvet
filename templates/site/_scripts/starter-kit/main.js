import 'babel-polyfill';
import objectFitImages from 'object-fit-images';
import svg4everybody from 'svg4everybody';
import {ready} from 'vanillajs-dom';
import app from './app';

import knockout from 'knockout';
global.ko = knockout;

window.app = app;

ready(() => {
  svg4everybody();
  objectFitImages();
  window.app.start();
});
