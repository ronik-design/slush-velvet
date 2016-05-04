import 'babel-polyfill';
import objectFitImages from 'object-fit-images';
import svg4everybody from 'svg4everybody';

import {ready} from 'vanillajs-dom';
import app from './app';

window.app = app;

ready(() => {
  svg4everybody();
  objectFitImages();
  window.app.start();
});
