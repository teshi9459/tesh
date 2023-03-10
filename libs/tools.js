const fs = require('fs');
module.exports = {
  /**
   * sortiert Array
   * @param {Array} ary - Array zu sortieren.
   * @param {boolean} options - true für log.
   */
  sort: function (ary, options) {
    ary = ary.sort(function (a, b) {
      return a - b;
    });
    if (options === true) console.log('tools> sorted an Array');
    return ary;
  },
  /**
   * invertiert Array
   * @param {Array} ary - Array zu invertieren.
   * @param {boolean} options - true für log.
   */
  invert: function (ary, options) {
    ary = ary.sort(function (a, b) {
      return b - a;
    });
    if (options === true) console.log('tools> inverted an Array');
    return ary;
  },
  /**
   * wandelt json Datei in Objekt um
   * @param {String} path - Pfad zur Datei.
   * @param {boolean} options - true für log.
   */
  getJ: function (path, options) {
    const rawdata = fs.readFileSync(path, 'utf8');
    if (options === true)
      console.log('tools> get JSON from ' + path + ' |\n' + rawdata);
    return JSON.parse(rawdata);
  },
  /**
   * wandelt json Datei in Objekt um
   * @param {String} path - Pfad zur Datei.
   * @param {Object} obj - JSON Objekt.
   * @param {boolean} options - true für log.
   */
  setJ: function (path, obj, options) {
    this.path(path, options);
    const json = JSON.stringify(obj);
    fs.writeFileSync(path, json);
    if (options === true)
      console.log('tools> wrote Json to ' + path + ' | ' + obj);
  },
  /**
   * wartet angegebnene Zeit
   * @param {Number} ms - Dauer in ms.
   * @param {boolean} options - true für log.
   */
  wait: function (ms, options) {
    let start,
      now = Date.now();
    while (now - start < ms) {
      now = Date.now();
    }
    if (options === true) console.log(`tools> waited ${ms} ms`);
  },
  /**
   * gibt random Nummer zurück
   * @param {Number} min - kleinste Zahl (inklusive).
   * @param {Number} max - größte Zahl (inklusive).
   * @param {boolean} options - true für log.
   */
  random: function (min, max, options) {
    const out = Math.floor(Math.random() * max) + min;
    if (options === true)
      console.log(`tools> generated random number from ${min} to ${max}`);
    return out;
  },
  /**
   * erstellt Verzeichisstrucktur, wenn nicht schon vorhanden
   * @param {String} path - Pfad bis zum ende der Strucktur.
   * @param {boolean} options - true für log.
   */
  path: function (path, options) {
    let folder = path.split('/');
    folder.pop();
    if (!fs.existsSync(path)) {
      for (let i = 2; i <= folder.length; i++) {
        let rest = '';
        for (let j = 0; j < i; j++) {
          rest = rest + folder[j] + '/';
        }
        if (!fs.existsSync(rest)) fs.mkdirSync(rest);
      }
      if (options === true) console.log('tools> Path ' + path + ' now exists');
    } else {
      if (options === true)
        console.log('tools> Path ' + path + ' already exists');
    }
  },
  /**
   * löscht Verzeichisstrucktur
   * @param {String} path - Ordner der zu löschen ist.
   * @param {boolean} options - true für log.
   */
  delPath: function (path, options) {
    fs.rmSync(path, {
      recursive: true,
    });
    if (options === true) console.log(`tools> ${path} is deleted`);
  },
  /**
   * entfernt alle Indexe aus einem Array mit Wert value
   * @param {any} value - Wert der zu enttfernen ist.
   * @param {Array} arr - entsprechender Array.
   * @param {boolean} options - true für log.
   */
  popA: function (arr, value, options) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == value) {
        arr.splice(i, 1);
        i--;
      }
    }
    if (options === true) console.log(`tools> ${value} aus Array entfernt`);
    return arr;
  },
};
