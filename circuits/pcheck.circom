pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";

template P() {
    signal input a;
    signal input b;
    signal output h1;
    signal output h2;

    component p1 = Poseidon(1);
    p1.inputs[0] <== a;
    h1 <== p1.out;

    component p2 = Poseidon(2);
    p2.inputs[0] <== a;
    p2.inputs[1] <== b;
    h2 <== p2.out;
}

component main = P();
