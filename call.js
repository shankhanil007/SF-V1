var uuid = require("uuid");

var calls = [];

function Call() {
  this.peers = [];
}

Call.prototype.toJSON = function () {
  return { peers: this.peers };
};

Call.prototype.addPeer = function (peerId) {
  this.peers.push(peerId);
};

Call.create = function () {
  var call = new Call();
  calls.push(call);
  return call;
};

Call.getAll = function () {
  return calls;
};

module.exports = Call;
