var j2c, 
    // used to normalize styles for reliable comparison.
    crass = require("crass"),
    expect = require("expect.js");

function dont_call_me(){
    // workaround for browserify
    require("../dist/j2c.commonjs");
    require("../dist/j2c.commonjs.min");
    require("../dist/inline/j2c.commonjs");
    require("../dist/inline/j2c.commonjs.min");
}

function normalize(s) { return crass.parse(s).optimize().toString(); }

function check(result, expected){
    result = normalize(result);

    // since you can't rely on the order of JS object keys, sometimes, several "expected"
    // values must be provided.
    expected = (expected instanceof Array ? expected : [expected]).map(function(s){
        return normalize(s);
    });
    expect(expected).to.contain(result);
}

function randStr() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
}
function randInt() {
    return Math.random().toString().substr(2, 3);
}

[
    "../dist/j2c.commonjs",
    "../dist/j2c.commonjs.min",
    "../dist/inline/j2c.commonjs",
    "../dist/inline/j2c.commonjs.min"
].forEach(function(lib){
    var j2c = require(lib);

    function checkinline(result, expected, vendors){
        result = "p{" + j2c({inline:result, vendors:vendors}) + "}";
        expected = (expected instanceof Array ? expected : [expected]).map(function(s){
            return "p{" + s + "}";
        });
        check(result, expected);
    }



      //////////////////////////////
     /**/  suite("Inline, ");  /**/
    //////////////////////////////


    test("a single property", function() {
        checkinline(
            {foo:"bar"},
            "foo:bar;"
        );
    });

    test("array of values", function() {
        checkinline(
            {foo:["bar", "baz"]},
            "foo:bar;foo:baz;"
        );
    });

    test("sub-properties", function(){
        checkinline(
            {foo:{bar:"baz"}},
            "foo-bar:baz;"
        );
    });

    test("multiple sub-properties", function(){
        checkinline(
            {foo:{bar$qux:"baz"}},
            "foo-bar:baz;foo-qux:baz;"
        );
    });

    test("multiple sub-properties with a sub-sub-property", function(){
        checkinline(
            {foo:{bar$baz:{qux:"quux"}}},
            "foo-bar-qux:quux;foo-baz-qux:quux;"
        );
    });

    test("multiple sub-properties with two sub-sub-properties", function(){
        checkinline(
            {foo:{bar$baz:{qux$quux:"fred"}}},
            "foo-bar-qux:fred;foo-bar-quux:fred;foo-baz-qux:fred;foo-baz-quux:fred;"
        );
    });

    test("convert underscores", function() {
        checkinline(
            {"f_o_o":"bar"},
            "f-o-o:bar;"
        );
    });

    test("String value", function() {
        checkinline(
            "foo:bar",
            "foo:bar;"
        );
    });

    test("Array of Strings values", function() {
        checkinline(
            ["foo:bar","foo:baz"],
            "foo:bar;foo:baz"
        );
    });

    test("Array of mixed values at the root", function() {
        checkinline(
            ["foo:bar",{foo:"baz"}],
            "foo:bar;foo:baz"
        );
    });

    test("Array of mixed value and sub-property", function() {
        checkinline(
            {foo:["bar", {baz:"qux"}]},
            "foo:bar;foo-baz:qux"
        );
    });

    test("Prefixes by hand", function() {
        checkinline(
            {_o$_p$:{foo:"bar"}},
            "-o-foo:bar;-p-foo:bar;foo:bar;"
        );
    });

    test("CSS *Hack", function() {
        checkinline(
            {"*foo":"bar"},
            "*foo:bar;"
        );
    });

    test("CSS _Hack", function() {
        checkinline(
            ["_foo:bar",{_baz:"qux"}],
            "_foo:bar;-baz:qux;"
        );
    });



      ////////////////////////////////////////////
     /**/  suite("Inline auto prefixes, ");  /**/
    ////////////////////////////////////////////

    test("vendor prefixes", function() {
        checkinline(
            ["foo:bar",{foo:"baz"}],
            "-o-foo:bar;-p-foo:bar;foo:bar;-o-foo:baz;-p-foo:baz;foo:baz",
            ["o", "p"]
        );
    });

      //////////////////////////////////
     /**/  suite("j2c.prefix, ");  /**/
    //////////////////////////////////

    test("1 x 1", function() {
        var prod = j2c.prefix("foo", ["o"]);
        expect(prod[0]).to.be("-o-foo");
        expect(prod[1]).to.be("foo");
    });

    test("2 x 1", function() {
        var prod = j2c.prefix("foo", ["o", "p"]);
        expect(prod[0]).to.be("-o-foo");
        expect(prod[1]).to.be("-p-foo");
        expect(prod[2]).to.be("foo");
    });

});




["../dist/j2c.commonjs", "../dist/j2c.commonjs.min"].forEach(function(lib){
    var j2c = require(lib);


      /////////////////////////////////
     /**/  suite("j2c.sheet, ");  /**/
    /////////////////////////////////


    test("direct sheet call", function(){
        check(
            j2c({sheet: {" p":{foo:5}} }), 
            "p{foo:5}"
        );
    });


      ///////////////////////////////////
     /**/  suite("Definitions, ");  /**/
    ///////////////////////////////////


    test("basic", function() {
        check(
            j2c({sheet: {" p": {
                foo:"bar"
            }}}),
            "p{foo:bar}"
        );
    });

    test("convert underscores", function() {
        check(
            j2c({sheet: {" p": {
                foo_foo:"bar"
            }}}),
            "p{foo-foo:bar}"
        );
    });

    test("number values", function() {
        check(
            j2c({sheet: {" p": {
                foo:5
            }}}),
            "p{foo:5}"
        );
    });

    test("composed property name", function() {
        check(
            j2c({sheet: {" p": {
                foo:{bar:"baz"}
            }}}),

            "p{foo-bar:baz}"
        );
    });

    test("composed selector : child with a given class", function() {
        check(
            j2c({sheet: {" p": {
                " .foo":{bar:"baz"}
            }}, global:true}),

            "p .foo{bar:baz}"
        );
    });

    test("composed selector: add a class to the root", function() {
        check(
            j2c({sheet: {" p": {
                ".foo":{bar:"baz"}
            }}, global:true}),

            "p.foo{bar:baz}"
        );
    });

    test("manual vendor prefixes", function() {
        check(
            j2c({sheet: {" p": {
                _o$_ms$_moz$_webkit$: {foo: "bar"}
            }}}),

            "p {-o-foo:bar;-ms-foo:bar;-moz-foo:bar;-webkit-foo:bar;foo:bar}"
        );
    });

    test("mixing definitions and sub-selectors", function() {
        check(
            j2c({sheet: {" p": {
                foo:"bar",
                " .foo":{bar:"baz"}
            }}, global:true}),

            ["p .foo{bar:baz} p {foo:bar}", "p {foo:bar} p .foo{bar:baz}"]
        );
    });



      //////////////////////////////////////////////////
     /**/  suite("Selector Cartesian product, ");  /**/
    //////////////////////////////////////////////////


    test("1 x 2", function() {
        check(
            j2c({sheet: {" p": {
                " .foo":{
                    ":before,:after":{
                        foo:"bar"
                    }
                }
            }}, global:true}),

            "p .foo:before, p .foo:after {foo:bar}"
        );
    });

    test("2 x 1", function() {
        check(
            j2c({sheet: {" p": {
                " .foo, .bar":{
                    ":before":{
                        foo:"bar"
                    }
                }
            }}, global:true}),

            "p .foo:before, p .bar:before {foo:bar}"
        );
    });

    test("2 x 2", function() {
        check(
            j2c({sheet: {" p": {
                " .foo, .bar":{
                    ":before,:after":{
                        foo:"bar"
                    }
                }
            }}, global:true}),

            "p .foo:before, p .bar:before, p .foo:after, p .bar:after {foo:bar}"
        );
    });


    test("2 x 3 one of which is empty", function() {
        check(
            j2c({sheet: {" p": {
                " .foo, .bar":{
                    ",:before,:after":{
                        foo:"bar"
                    }
                }
            }}, global:true}),

            "p .foo, p .bar, p .foo:before, p .bar:before, p .foo:after, p .bar:after {foo:bar}"
        );
    });



      /////////////////////////////////
     /**/  suite("Ampersand, ");  /**/
    //////////////////////////////////


    test("composed selector: add a class to the root", function() {
        check(
            j2c({sheet: {" p": {
                ".foo &":{bar:"baz"}
            }}, global:true}),

            ".foo p{bar:baz}"
        );
    });

    test("& &", function() {
        check(
            j2c({sheet: {".foo": {
                "& &": {
                    bar: "baz"
                }
            }}, global:true}),
            ".foo .foo{bar:baz}"
        );
    });

    test("2 x 2", function() {
        check(
            j2c({sheet: {" p": {
                " .foo, .bar":{
                    " .baz &, .qux":{
                        foo:"bar"
                    }
                }
            }}, global:true}),

            ".baz p .foo,.baz p .bar,p .foo .qux ,p .bar .qux {foo:bar}"
        );
    });

      //////////////////////////////////////////
     /**/  suite("Strings and Arrays, ");  /**/
    //////////////////////////////////////////


    test("String literal", function() {
        check(
            j2c({sheet: {" p": "foo:bar"}}),
            "p{foo:bar}"
        );
    });

    test("String literal with two declarations", function() {
        check(
            j2c({sheet: {" p": "foo:bar;baz:qux"}}),
            "p {foo:bar;baz:qux}"
        );
    });

    test("String literal starting with an underscore", function() {
        check(
            j2c({sheet: {" p": "_foo:bar"}}),
            "p {_foo:bar}"
        );
    });

    test("Array of String literals", function() {
        check(
            j2c({sheet: {" p": ["foo:bar", "foo:baz"]}}),
            "p{foo:bar;foo:baz}"
        );
    });


    test("overloaded properties", function() {
        check(
            j2c({sheet: {" p": {
                foo:["bar","baz"]
            }}}),
            "p{foo:bar;foo:baz}"
        );
    });

    test("overloaded sub-properties", function() {
        check(
            j2c({sheet: {" p": {
                foo:[{bar:"baz"},{bar:"qux"}]
            }}}),
            "p{foo-bar:baz;foo-bar:qux}"
        );
    });

    test("nested Arrays", function(){
        check(
            j2c({sheet: {" p": [
                [
                    {bar:"baz"},
                    {bar:"qux"}
                ],
                "bar:quux;"
            ]}}),
            "p {bar:baz;bar:qux;bar:quux}"
        );
    });



      ///////////////////////////////////////////
     /**/  suite("Sheet auto prefixes, ");  /**/
    ///////////////////////////////////////////

    test("String literal", function() {
        check(
            j2c({sheet: {" p": "foo:bar"}, vendors: ["o", "p"]}),
            "p{-o-foo:bar;-p-foo:bar;foo:bar}"
        );
    });

    test("Array of Strings", function() {
        check(
            j2c({sheet: {" p": ["foo:bar", "_baz:qux"]}, vendors: ["o", "p"]}),
            "p{-o-foo:bar;-p-foo:bar;foo:bar;-o-_baz:qux;-p-_baz:qux;_baz:qux}"
        );
    });



      ////////////////////////////////
     /**/  suite("At rules, ");  /**/
    ////////////////////////////////


    test("standard At rule with text value", function() {
        check(
            j2c({sheet: {" p": {
                "@import":"'bar'"
            }}, vendors:["o", "p"]}),

            "@import 'bar';"
        );
    });

    test("standard At rule with object value", function() {
        check(
            j2c({sheet: {" p": {
                "@media foo":{bar:"baz"}
            }}, vendors:["o", "p"]}),

            "@media foo {p{-o-bar:baz;-p-bar:baz;bar:baz}}"
        );
    });

    test("several At rules with object value", function() {
        check(
            j2c({sheet: {" p": {
                "@media foo":{bar:"baz"},
                "@media foo2":{bar2:"baz2"}
            }}, vendors:["o", "p"]}),
            [
                "@media foo {p{-o-bar:baz;-p-bar:baz;bar:baz}} @media foo2 {p{-o-bar2:baz2;-p-bar2:baz2;bar2:baz2}}",
                "@media foo2 {p{-o-bar2:baz2;-p-bar2:baz2;bar2:baz2}} @media foo {p{-o-bar:baz;-p-bar:baz;bar:baz}}"
            ]
        );
    });

    test("Array of At rules with text values", function() {
        check(
            j2c({sheet: {" p": [
                {"@import":"'bar'"},
                {"@import":"'baz'"}
            ]}, vendors: ["o", "p"]}),
            "@import 'bar'; @import 'baz';"
        );
    });

    test("nested of At rules", function() {
        check(
            j2c({sheet: {" p": {"@media screen":{width:1000,"@media (max-width: 12cm)":{size:5}}}}, vendors:["o", "p"]}),
            [
                '@media screen{@media (max-width:12cm){p{-o-size:5;-p-size:5;size:5}}p{-o-width:1000;-p-width:1000;width:1000}}',
                '@media screen{p{-o-width:1000;-p-width:1000;width:1000}@media (max-width:12cm){p{-o-size:5;-p-size:5;size:5}}}'
            ]
        );
    });

    test("@font-face", function(){
        check(
            j2c({sheet: {" p": {"@font-face":{foo:"bar"}}}, vendors: ["o", "p"]}),
            "@font-face{foo:bar}"
        );
    });

    test("@font-face two fonts", function(){
        check(
            j2c({sheet: {" p": {"@font-face":[{foo:"bar"},{foo:"baz"}]}}, vendors: ["o", "p"]}),
            "@font-face{foo:bar}@font-face{foo:baz}"
        );
    });

    test("@keyframes", function(){
        check(
            j2c({sheet: {" p": {"@keyframes qux": {
                " from":{foo:"bar"},
                " to":{foo:"baz"}
            }}}, global:true, vendors: ["o", "p"]}),
            [
                "@-webkit-keyframes qux{from{-webkit-foo:bar;foo:bar}to{-webkit-foo:baz;foo:baz}}" +
                "@keyframes qux{from{-o-foo:bar;-p-foo:bar;foo:bar}to{-o-foo:baz;-p-foo:baz;foo:baz}}",

                "@-webkit-keyframes qux{to{-webkit-foo:baz;foo:baz}from{-webkit-foo:bar;foo:bar}}" +
                "@keyframes qux{to{-o-foo:baz;-p-foo:baz;foo:baz}from{-o-foo:bar;-p-foo:bar;foo:bar}}",
            ]
        );
    });

      //////////////////////////////
     /**/  suite("Locals, ");  /**/
    //////////////////////////////


    test("a local class", function(){
        var css = j2c({sheet: {".bit":{foo:5}}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.indexOf("." + css.bit + "{\nfoo:5;\n}")).not.to.be(-1);
    });

    test("a local class with a global animation of the same name", function(){
        var css = j2c({sheet: {".bit":{foo:5}}, global:{animations:['bit']}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.indexOf("." + css.bit + "{\nfoo:5;\n}")).not.to.be(-1);
    });

    test("two local classes", function(){
        var css = j2c({sheet: {".bit":{foo:5},".bat":{bar:6}}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.bit.slice(4)).to.be(css.bat.slice(4));
        expect(css.indexOf("." + css.bit + "{\nfoo:5;\n}")).not.to.be(-1);
        expect(css.indexOf("." + css.bat + "{\nbar:6;\n}")).not.to.be(-1);
    });

    test("a local and a global classes", function(){
        var css = j2c({sheet: {".bit":{foo:5},".bat":{bar:6}}, global:{classes:["bat"]}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.bat).to.be(undefined);
        expect(css.indexOf("." + css.bit + "{\nfoo:5;\n}")).not.to.be(-1);
        expect(css.indexOf(".bat{\nbar:6;\n}")).not.to.be(-1);
    });

    test("two local classes, nested", function(){
        var css = j2c({sheet: {".bit":{foo:5,".bat":{bar:6}}}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.bit.slice(4)).to.be(css.bat.slice(4));
        expect(css.indexOf("." + css.bit + "{\nfoo:5;\n}")).not.to.be(-1);
        expect(css.indexOf("." + css.bit +"." + css.bat + "{\nbar:6;\n}")).not.to.be(-1);
    });

    test("@keyframes", function(){
        var css = j2c({sheet: {"@keyframes bit":{}}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.indexOf("@keyframes " + css.bit +"{")).not.to.be(-1);
    });

    test("@keyframes with a global class of the same name", function(){
        var css = j2c({sheet: {"@keyframes bit":{}}, global:{classes:["bit"]}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.indexOf("@keyframes " + css.bit +"{")).not.to.be(-1);
    });

    test("a global @keyframes", function() {
        var css = j2c({sheet: {"@keyframes bit":{}}, global:{animations:["bit"]}});
        expect(css.bit).to.be(undefined);
        expect(css.indexOf("@keyframes bit{")).not.to.be(-1);
    });

    test("one animation", function(){
        var css = j2c({sheet: {" p":{animation:"bit 1sec"}}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.indexOf("animation:" + css.bit +" ")).not.to.be(-1);
    });

    test("one animation with a global class of the same name", function(){
        var css = j2c({sheet: {" p":{animation:"bit 1sec"}}, global:{classes:["bit"]}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.indexOf("animation:" + css.bit +" ")).not.to.be(-1);
    });

    test("a global animation", function() {
        var css = j2c({sheet: {" p":{animation:"bit 1sec"}}, global:{animations:["bit"]}});
        expect(css.bit).to.be(undefined);
        expect(css.indexOf("animation:bit ")).not.to.be(-1);
    });

    test("one animation-name", function() {
        var css = j2c({sheet: {" p":{animation_name:"bit"}}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.indexOf("animation-name:" + css.bit +";")).not.to.be(-1);
    });

    test("two animation-name", function() {
        var css = j2c({sheet: {" p":{animation_name:"bit, bat"}}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.bit.slice(4)).to.be(css.bat.slice(4));
        expect(css.indexOf("animation-name:" + css.bit +", " + css.bat)).not.to.be(-1);
    });

    test("two animation-name, one global", function() {
        var css = j2c({sheet: {" p":{animation_name:"bit, bat"}},global:{animations:["bat"]}});
        expect(css.bit.slice(0,8)).to.be("bit_j2c_");
        expect(css.bat).to.be(undefined);
        expect(css.indexOf("animation-name:" + css.bit +", bat;")).not.to.be(-1);
    });



      ////////////////////////////////////
     /**/  suite("Foolproofing, ");  /**/
    ////////////////////////////////////


    test("property-like selector", function() {
        var E;
        try{
            j2c({sheet: {"g,p":{animation_name:"bit, bat"}}});
        } catch(e) {
            E = e;
        }
        expect(E).not.to.be(undefined);
        expect(["invalid selector 'p'", "invalid selector 'g'"]).to.contain(E);
    });


    test("property-like sub-selector", function() {
        var E;
        try{
            j2c({sheet: {".foo":{"g,p":{animation_name:"bit, bat"}}}});
        } catch(e) {
            E = e;
        }
        expect(E).not.to.be(undefined);
        expect(["invalid selector 'p'", "invalid selector 'g'"]).to.contain(E);
    });



      /////////////////////////////
     /**/  suite("Order, ");  /**/
    /////////////////////////////


    // This tests is intended to ensure that the properties -> subselectors -> @rules is 
    // respected, regardless of the input order. If a sheet ends up out of order, `total`
    //  is encremented. That shouldn't happen.

    test("declarations > subselectors > @rules", function(){
        var total = 0,
            prop = randStr(),
            klass = randStr(),
            width = randInt(),
            o;
        for (var i = 17; i--;){
            o = {" p":{}};
            o[" p"][prop] = 5;
            o[" p"]["."+klass] = {foo:6};
            o[" p"]["@media (min-width:" + width + "em)"] = {bar:7};
            if (
                normalize(j2c({sheet: o, global:true})) != 
                normalize("p{" + prop +":5;} p." + klass + "{foo:6;} @media (min-width:" + width + "em){p{bar:7;}}")
            ) total++;
            o = {" p":{}};
            o[" p"][prop] = 5;
            o[" p"]["@media (min-width:" + width + "em)"] = {bar:7};
            o[" p"]["."+klass] = {foo:6};
            if (
                normalize(j2c({sheet: o, global:true})) != 
                normalize("p{" + prop +":5;} p." + klass + "{foo:6;} @media (min-width:" + width + "em){p{bar:7;}}")
            ) total++;
            o = {" p":{}};
            o[" p"]["."+klass] = {foo:6};
            o[" p"][prop] = 5;
            o[" p"]["@media (min-width:" + width + "em)"] = {bar:7};
            if (
                normalize(j2c({sheet: o, global:true})) != 
                normalize("p{" + prop +":5;} p." + klass + "{foo:6;} @media (min-width:" + width + "em){p{bar:7;}}")
            ) total++;
            o = {" p":{}};
            o[" p"]["."+klass] = {foo:6};
            o[" p"]["@media (min-width:" + width + "em)"] = {bar:7};
            o[" p"][prop] = 5;
            if (
                normalize(j2c({sheet: o, global:true})) != 
                normalize("p{" + prop +":5;} p." + klass + "{foo:6;} @media (min-width:" + width + "em){p{bar:7;}}")
            ) total++;
            o = {" p":{}};
            o[" p"]["@media (min-width:" + width + "em)"] = {bar:7};
            o[" p"]["."+klass] = {foo:6};
            o[" p"][prop] = 5;
            if (
                normalize(j2c({sheet: o, global:true})) != 
                normalize("p{" + prop +":5;} p." + klass + "{foo:6;} @media (min-width:" + width + "em){p{bar:7;}}")
            ) total++;
            o = {" p":{}};
            o[" p"]["@media (min-width:" + width + "em)"] = {bar:7};
            o[" p"][prop] = 5;
            o[" p"]["."+klass] = {foo:6};
            if (
                normalize(j2c({sheet: o, global:true})) != 
                normalize("p{" + prop +":5;} p." + klass + "{foo:6;} @media (min-width:" + width + "em){p{bar:7;}}")
            ) total++;
        }
        expect(total).to.be(0);
    });
});
