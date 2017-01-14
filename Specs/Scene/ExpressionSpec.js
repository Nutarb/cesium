/*global defineSuite*/
defineSuite([
        'Scene/Expression',
        'Core/Cartesian2',
        'Core/Cartesian3',
        'Core/Cartesian4',
        'Core/Color',
        'Core/Math',
        'Scene/ExpressionNodeType'
    ], function(
        Expression,
        Cartesian2,
        Cartesian3,
        Cartesian4,
        Color,
        CesiumMath,
        ExpressionNodeType) {
    'use strict';

    var frameState = {};

    function MockFeature() {
        this._properties = {};
        this._className = undefined;
        this._inheritedClassName = undefined;
        this._content = {
            _tileset : {
                timeSinceLoad : 0.0
            }
        };
    }

    MockFeature.prototype.addProperty = function(name, value) {
        this._properties[name] = value;
    };

    MockFeature.prototype.getProperty = function(name) {
        return this._properties[name];
    };

    MockFeature.prototype.setClass = function(className) {
        this._className = className;
    };

    MockFeature.prototype.setInheritedClass = function(className) {
        this._inheritedClassName = className;
    };

    MockFeature.prototype.isExactClass = function(className) {
        return this._className === className;
    };

    MockFeature.prototype.isClass = function(className) {
        return (this._className === className) || (this._inheritedClassName === className);
    };

    MockFeature.prototype.getExactClassName = function() {
        return this._className;
    };

    it('parses backslashes', function() {
        var expression = new Expression('"\\he\\\\\\ll\\\\o"');
        expect(expression.evaluate(frameState, undefined)).toEqual('\\he\\\\\\ll\\\\o');
    });

    it('evaluates variable', function() {
        var feature = new MockFeature();
        feature.addProperty('height', 10);
        feature.addProperty('width', 5);
        feature.addProperty('string', 'hello');
        feature.addProperty('boolean', true);
        feature.addProperty('vector', Cartesian3.UNIT_X);
        feature.addProperty('null', null);
        feature.addProperty('undefined', undefined);

        var expression = new Expression('${height}');
        expect(expression.evaluate(frameState, feature)).toEqual(10);

        expression = new Expression('\'${height}\'');
        expect(expression.evaluate(frameState, feature)).toEqual('10');

        expression = new Expression('${height}/${width}');
        expect(expression.evaluate(frameState, feature)).toEqual(2);

        expression = new Expression('${string}');
        expect(expression.evaluate(frameState, feature)).toEqual('hello');

        expression = new Expression('\'replace ${string}\'');
        expect(expression.evaluate(frameState, feature)).toEqual('replace hello');

        expression = new Expression('\'replace ${string} multiple ${height}\'');
        expect(expression.evaluate(frameState, feature)).toEqual('replace hello multiple 10');

        expression = new Expression('"replace ${string}"');
        expect(expression.evaluate(frameState, feature)).toEqual('replace hello');

        expression = new Expression('\'replace ${string\'');
        expect(expression.evaluate(frameState, feature)).toEqual('replace ${string');

        expression = new Expression('${boolean}');
        expect(expression.evaluate(frameState, feature)).toEqual(true);

        expression = new Expression('\'${boolean}\'');
        expect(expression.evaluate(frameState, feature)).toEqual('true');

        expression = new Expression('${vector}');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian3.UNIT_X);

        expression = new Expression('\'${vector}\'');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian3.UNIT_X.toString());

        expression = new Expression('${null}');
        expect(expression.evaluate(frameState, feature)).toEqual(null);

        expression = new Expression('\'${null}\'');
        expect(expression.evaluate(frameState, feature)).toEqual('');

        expression = new Expression('${undefined}');
        expect(expression.evaluate(frameState, feature)).toEqual(undefined);

        expression = new Expression('\'${undefined}\'');
        expect(expression.evaluate(frameState, feature)).toEqual('');

        expect(function() {
            return new Expression('${height');
        }).toThrowDeveloperError();
    });

    it('gets expressions', function() {
        var expressionString = "(regExp('^Chest').test(${County})) && (${YearBuilt} >= 1970)";
        var expression = new Expression(expressionString);
        expect(expression.expression).toEqual(expressionString);
    });

    it('throws on invalid expressions', function() {
        expect(function() {
            return new Expression(false);
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('this');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('2; 3;');
        }).toThrowDeveloperError();
    });

    it('throws on unknown characters', function() {
        expect(function() {
            return new Expression('#');
        }).toThrowDeveloperError();
    });

    it('throws on unmatched parenthesis', function() {
        expect(function() {
            return new Expression('((true)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('(true))');
        }).toThrowDeveloperError();
    });

    it('throws on unknown identifiers', function() {
        expect(function() {
            return new Expression('flse');
        }).toThrowDeveloperError();
    });

    it('throws on unknown function calls', function() {
        expect(function() {
            return new Expression('unknown()');
        }).toThrowDeveloperError();
    });

    it('throws on unknown member function calls', function() {
        expect(function() {
            return new Expression('regExp().unknown()');
        }).toThrowDeveloperError();
    });

    it('throws with unsupported operators', function() {
        expect(function() {
            return new Expression('~1');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('2 | 3');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('2 & 3');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('2 << 3');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('2 >> 3');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('2 >>> 3');
        }).toThrowDeveloperError();
    });

    it('evaluates literal null', function() {
        var expression = new Expression('null');
        expect(expression.evaluate(frameState, undefined)).toEqual(null);
    });

    it('evaluates literal undefined', function() {
        var expression = new Expression('undefined');
        expect(expression.evaluate(frameState, undefined)).toEqual(undefined);
    });

    it('evaluates literal boolean', function() {
        var expression = new Expression('true');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('false');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('converts to literal boolean', function() {
        var expression = new Expression('Boolean()');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('Boolean(1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('Boolean("true")');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);
    });

    it('evaluates literal number', function() {
        var expression = new Expression('1');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('0');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);

        expression = new Expression('NaN');
        expect(expression.evaluate(frameState, undefined)).toEqual(NaN);

        expression = new Expression('Infinity');
        expect(expression.evaluate(frameState, undefined)).toEqual(Infinity);

        expression = new Expression('PI');
        expect(expression.evaluate(frameState, undefined)).toEqual(Math.PI);

        expression = new Expression('E');
        expect(expression.evaluate(frameState, undefined)).toEqual(Math.E);
    });

    it('converts to literal number', function() {
        var expression = new Expression('Number()');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);

        expression = new Expression('Number("1")');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('Number(true)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);
    });

    it('evaluates literal string', function() {
        var expression = new Expression('\'hello\'');
        expect(expression.evaluate(frameState, undefined)).toEqual('hello');

        expression = new Expression('\'Cesium\'');
        expect(expression.evaluate(frameState, undefined)).toEqual('Cesium');

        expression = new Expression('"Cesium"');
        expect(expression.evaluate(frameState, undefined)).toEqual('Cesium');
    });

    it('converts to literal string', function() {
        var expression = new Expression('String()');
        expect(expression.evaluate(frameState, undefined)).toEqual('');

        expression = new Expression('String(1)');
        expect(expression.evaluate(frameState, undefined)).toEqual('1');

        expression = new Expression('String(true)');
        expect(expression.evaluate(frameState, undefined)).toEqual('true');
    });

    it('evaluates literal color', function() {
        var expression = new Expression('color(\'#ffffff\')');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('color(\'#00FFFF\')');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.CYAN));

        expression = new Expression('color(\'#fff\')');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('color(\'#0FF\')');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.CYAN));

        expression = new Expression('color(\'white\')');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('color(\'cyan\')');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.CYAN));

        expression = new Expression('color(\'white\', 0.5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.fromAlpha(Color.WHITE, 0.5)));

        expression = new Expression('rgb(255, 255, 255)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('rgb(100, 255, 190)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.fromBytes(100, 255, 190)));

        expression = new Expression('hsl(0, 0, 1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('hsl(1.0, 0.6, 0.7)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.fromHsl(1.0, 0.6, 0.7)));

        expression = new Expression('rgba(255, 255, 255, 0.5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.fromAlpha(Color.WHITE, 0.5)));

        expression = new Expression('rgba(100, 255, 190, 0.25)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.fromBytes(100, 255, 190, 0.25 * 255)));

        expression = new Expression('hsla(0, 0, 1, 0.5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(new Color(1.0, 1.0, 1.0, 0.5)));

        expression = new Expression('hsla(1.0, 0.6, 0.7, 0.75)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.fromHsl(1.0, 0.6, 0.7, 0.75)));

        expression = new Expression('color()');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.WHITE));
    });

    it('evaluates literal color with result parameter', function() {
        var color = new Color();

        var expression = new Expression('color(\'#0000ff\')');
        expect(expression.evaluateColor(frameState, undefined, color)).toEqual(Color.BLUE);
        expect(color).toEqual(Color.BLUE);

        expression = new Expression('color(\'#f00\')');
        expect(expression.evaluateColor(frameState, undefined, color)).toEqual(Color.RED);
        expect(color).toEqual(Color.RED);

        expression = new Expression('color(\'cyan\')');
        expect(expression.evaluateColor(frameState, undefined, color)).toEqual(Color.CYAN);
        expect(color).toEqual(Color.CYAN);

        expression = new Expression('color(\'white\', 0.5)');
        expect(expression.evaluateColor(frameState, undefined, color)).toEqual(new Color(1.0, 1.0, 1.0, 0.5));
        expect(color).toEqual(new Color(1.0, 1.0, 1.0, 0.5));

        expression = new Expression('rgb(0, 0, 0)');
        expect(expression.evaluateColor(frameState, undefined, color)).toEqual(Color.BLACK);
        expect(color).toEqual(Color.BLACK);

        expression = new Expression('hsl(0, 0, 1)');
        expect(expression.evaluateColor(frameState, undefined, color)).toEqual(Color.WHITE);
        expect(color).toEqual(Color.WHITE);

        expression = new Expression('rgba(255, 0, 255, 0.5)');
        expect(expression.evaluateColor(frameState, undefined, color)).toEqual(new Color(1.0, 0, 1.0, 0.5));
        expect(color).toEqual(new Color(1.0, 0, 1.0, 0.5));

        expression = new Expression('hsla(0, 0, 1, 0.5)');
        expect(expression.evaluateColor(frameState, undefined, color)).toEqual(new Color(1.0, 1.0, 1.0, 0.5));
        expect(color).toEqual(new Color(1.0, 1.0, 1.0, 0.5));

        expression = new Expression('color()');
        expect(expression.evaluateColor(frameState, undefined, color)).toEqual(Color.WHITE);
        expect(color).toEqual(Color.WHITE);
    });

    it('evaluates color with expressions as arguments', function() {
        var feature = new MockFeature();
        feature.addProperty('hex6', '#ffffff');
        feature.addProperty('hex3', '#fff');
        feature.addProperty('keyword', 'white');
        feature.addProperty('alpha', 0.2);

        var expression = new Expression('color(${hex6})');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('color(${hex3})');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('color(${keyword})');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('color(${keyword}, ${alpha} + 0.6)');
        expect(expression.evaluate(frameState, feature).x).toEqual(1.0);
        expect(expression.evaluate(frameState, feature).y).toEqual(1.0);
        expect(expression.evaluate(frameState, feature).z).toEqual(1.0);
        expect(expression.evaluate(frameState, feature).w).toEqual(0.8);
    });

    it('evaluates rgb with expressions as arguments', function() {
        var feature = new MockFeature();
        feature.addProperty('red', 100);
        feature.addProperty('green', 200);
        feature.addProperty('blue', 255);

        var expression = new Expression('rgb(${red}, ${green}, ${blue})');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.fromBytes(100, 200, 255)));

        expression = new Expression('rgb(${red}/2, ${green}/2, ${blue})');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.fromBytes(50, 100, 255)));
    });

    it('evaluates hsl with expressions as arguments', function() {
        var feature = new MockFeature();
        feature.addProperty('h', 0.0);
        feature.addProperty('s', 0.0);
        feature.addProperty('l', 1.0);

        var expression = new Expression('hsl(${h}, ${s}, ${l})');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('hsl(${h} + 0.2, ${s} + 1.0, ${l} - 0.5)');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.fromHsl(0.2, 1.0, 0.5)));
    });

    it('evaluates rgba with expressions as arguments', function() {
        var feature = new MockFeature();
        feature.addProperty('red', 100);
        feature.addProperty('green', 200);
        feature.addProperty('blue', 255);
        feature.addProperty('a', 0.3);

        var expression = new Expression('rgba(${red}, ${green}, ${blue}, ${a})');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.fromBytes(100, 200, 255, 0.3*255)));

        expression = new Expression('rgba(${red}/2, ${green}/2, ${blue}, ${a} * 2)');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.fromBytes(50, 100, 255, 0.6*255)));
    });

    it('evaluates hsla with expressions as arguments', function() {
        var feature = new MockFeature();
        feature.addProperty('h', 0.0);
        feature.addProperty('s', 0.0);
        feature.addProperty('l', 1.0);
        feature.addProperty('a', 1.0);

        var expression = new Expression('hsla(${h}, ${s}, ${l}, ${a})');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('hsla(${h} + 0.2, ${s} + 1.0, ${l} - 0.5, ${a} / 4)');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.fromHsl(0.2, 1.0, 0.5, 0.25)));
    });

    it('evaluates rgba with expressions as arguments', function() {
        var feature = new MockFeature();
        feature.addProperty('red', 100);
        feature.addProperty('green', 200);
        feature.addProperty('blue', 255);
        feature.addProperty('alpha', 0.5);

        var expression = new Expression('rgba(${red}, ${green}, ${blue}, ${alpha})');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.fromBytes(100, 200, 255, 0.5 * 255)));

        expression = new Expression('rgba(${red}/2, ${green}/2, ${blue}, ${alpha} + 0.1)');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.fromColor(Color.fromBytes(50, 100, 255, 0.6 * 255)));
    });

    it('color constructors throw with wrong number of arguments', function() {
        expect(function() {
            return new Expression('rgb(255, 255)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('hsl(1, 1)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('rgba(255, 255, 255)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('hsla(1, 1, 1)');
        }).toThrowDeveloperError();
    });

    it('evaluates color properties (r, g, b, a)', function() {
        var expression = new Expression('color(\'#ffffff\').r');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgb(255, 255, 0).g');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('color("cyan").b');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgba(255, 255, 0, 0.5).a');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.5);
    });

    it('evaluates color properties (x, y, z, w)', function() {
        var expression = new Expression('color(\'#ffffff\').x');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgb(255, 255, 0).y');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('color("cyan").z');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgba(255, 255, 0, 0.5).w');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.5);
    });

    it('evaluates color properties ([0], [1], [2]. [3])', function() {
        var expression = new Expression('color(\'#ffffff\')[0]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgb(255, 255, 0)[1]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('color("cyan")[2]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgba(255, 255, 0, 0.5)[3]');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.5);
    });

    it('evaluates color properties (["r"], ["g"], ["b"], ["a"])', function() {
        var expression = new Expression('color(\'#ffffff\')["r"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgb(255, 255, 0)["g"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('color("cyan")["b"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgba(255, 255, 0, 0.5)["a"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.5);
    });

    it('evaluates color properties (["x"], ["y"], ["z"], ["w"])', function() {
        var expression = new Expression('color(\'#ffffff\')["x"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgb(255, 255, 0)["y"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('color("cyan")["z"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('rgba(255, 255, 0, 0.5)["w"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.5);
    });

    it('evaluates vec2', function() {
        var expression = new Expression('vec2(2.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(2.0, 2.0));

        expression = new Expression('vec2(3.0, 4.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(3.0, 4.0));

        expression = new Expression('vec2(vec2(3.0, 4.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(3.0, 4.0));

        expression = new Expression('vec2(vec3(3.0, 4.0, 5.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(3.0, 4.0));

        expression = new Expression('vec2(vec4(3.0, 4.0, 5.0, 6.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(3.0, 4.0));
    });

    it('throws if vec2 has invalid number of arguments', function() {
        var expression = new Expression('vec2()');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec2(3.0, 4.0, 5.0)');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec2(vec2(3.0, 4.0), 5.0)');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();
    });

    it('evaluates vec3', function() {
        var expression = new Expression('vec3(2.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(2.0, 2.0, 2.0));

        expression = new Expression('vec3(3.0, 4.0, 5.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(3.0, 4.0, 5.0));

        expression = new Expression('vec3(vec2(3.0, 4.0), 5.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(3.0, 4.0, 5.0));

        expression = new Expression('vec3(3.0, vec2(4.0, 5.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(3.0, 4.0, 5.0));

        expression = new Expression('vec3(vec3(3.0, 4.0, 5.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(3.0, 4.0, 5.0));

        expression = new Expression('vec3(vec4(3.0, 4.0, 5.0, 6.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(3.0, 4.0, 5.0));
    });

    it ('throws if vec3 has invalid number of arguments', function() {
        var expression = new Expression('vec3()');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec3(3.0, 4.0)');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec3(3.0, 4.0, 5.0, 6.0)');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec3(vec2(3.0, 4.0), vec2(5.0, 6.0))');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec3(vec4(3.0, 4.0, 5.0, 6.0), 1.0)');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();
    });

    it('evaluates vec4', function() {
        var expression = new Expression('vec4(2.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(2.0, 2.0, 2.0, 2.0));

        expression = new Expression('vec4(3.0, 4.0, 5.0, 6.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3.0, 4.0, 5.0, 6.0));

        expression = new Expression('vec4(vec2(3.0, 4.0), 5.0, 6.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3.0, 4.0, 5.0, 6.0));

        expression = new Expression('vec4(3.0, vec2(4.0, 5.0), 6.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3.0, 4.0, 5.0, 6.0));

        expression = new Expression('vec4(3.0, 4.0, vec2(5.0, 6.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3.0, 4.0, 5.0, 6.0));

        expression = new Expression('vec4(vec3(3.0, 4.0, 5.0), 6.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3.0, 4.0, 5.0, 6.0));

        expression = new Expression('vec4(3.0, vec3(4.0, 5.0, 6.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3.0, 4.0, 5.0, 6.0));

        expression = new Expression('vec4(vec4(3.0, 4.0, 5.0, 6.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3.0, 4.0, 5.0, 6.0));
    });

    it ('throws if vec4 has invalid number of arguments', function() {
        var expression = new Expression('vec4()');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec4(3.0, 4.0)');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec4(3.0, 4.0, 5.0)');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec4(3.0, 4.0, 5.0, 6.0, 7.0)');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('vec4(vec3(3.0, 4.0, 5.0))');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();
    });

    it('evaluates vector with expressions as arguments', function() {
        var feature = new MockFeature();
        feature.addProperty('height', 2);
        feature.addProperty('width', 4);
        feature.addProperty('depth', 3);
        feature.addProperty('scale', 1);

        var expression = new Expression('vec4(${height}, ${width}, ${depth}, ${scale})');
        expect(expression.evaluate(frameState, feature)).toEqual(new Cartesian4(2.0, 4.0, 3.0, 1.0));
    });

    it('evaluates expression with multiple nested vectors', function() {
        var expression = new Expression('vec4(vec2(1, 2)[vec3(6, 1, 5).y], 2, vec4(1.0).w, 5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(2.0, 2.0, 1.0, 5.0));
    });

    it('evaluates vector properties (x, y, z, w)', function() {
        var expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0).x');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0).y');
        expect(expression.evaluate(frameState, undefined)).toEqual(2.0);

        expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0).z');
        expect(expression.evaluate(frameState, undefined)).toEqual(3.0);

        expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0).w');
        expect(expression.evaluate(frameState, undefined)).toEqual(4.0);
    });

    it('evaluates vector properties ([0], [1], [2], [3])', function() {
        var expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0)[0]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0)[1]');
        expect(expression.evaluate(frameState, undefined)).toEqual(2.0);

        expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0)[2]');
        expect(expression.evaluate(frameState, undefined)).toEqual(3.0);

        expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0)[3]');
        expect(expression.evaluate(frameState, undefined)).toEqual(4.0);
    });

    it('evaluates vector properties (["x"], ["y"], ["z"]. ["w"])', function() {
        var expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0)["x"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0)["y"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(2.0);

        expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0)["z"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(3.0);

        expression = new Expression('vec4(1.0, 2.0, 3.0, 4.0)["w"]');
        expect(expression.evaluate(frameState, undefined)).toEqual(4.0);
    });

    it('evaluates unary not', function() {
        var expression = new Expression('!true');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('!!true');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);
    });

    it('evaluates unary negative', function() {
        var expression = new Expression('-5');
        expect(expression.evaluate(frameState, undefined)).toEqual(-5);

        expression = new Expression('-(-5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(5);
    });

    it('evaluates unary positive', function() {
        var expression = new Expression('+5');
        expect(expression.evaluate(frameState, undefined)).toEqual(5);

        expression = new Expression('+"5"');
        expect(expression.evaluate(frameState, undefined)).toEqual(5);

        expression = new Expression('+true');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('+null');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);
    });

    it('evaluates binary addition', function() {
        var expression = new Expression('1 + 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(3);

        expression = new Expression('1 + 2 + 3 + 4');
        expect(expression.evaluate(frameState, undefined)).toEqual(10);
    });

    it('evaluates binary subtraction', function() {
        var expression = new Expression('2 - 1');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('4 - 3 - 2 - 1');
        expect(expression.evaluate(frameState, undefined)).toEqual(-2);
    });

    it('evaluates binary multiplication', function() {
        var expression = new Expression('1 * 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(2);

        expression = new Expression('1 * 2 * 3 * 4');
        expect(expression.evaluate(frameState, undefined)).toEqual(24);
    });

    it('evaluates binary division', function() {
        var expression = new Expression('2 / 1');
        expect(expression.evaluate(frameState, undefined)).toEqual(2);

        expression = new Expression('1/2');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.5);

        expression = new Expression('24 / -4 / 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(-3);
    });

    it('evaluates binary modulus', function() {
        var expression = new Expression('2 % 1');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);

        expression = new Expression('6 % 4 % 3');
        expect(expression.evaluate(frameState, undefined)).toEqual(2);
    });

    it('evaluates binary equals strict', function() {
        var expression = new Expression('\'hello\' === \'hello\'');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('1 === 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('false === true === false');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('1 === "1"');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('evaluates binary equals', function() {
        var expression = new Expression('\'hello\' == \'hello\'');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('1 == 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('false == true == false');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('1 == "1"');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);
    });

    it('evaluates binary not equals strict', function() {
        var expression = new Expression('\'hello\' !== \'hello\'');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('1 !== 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('false !== true !== false');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('1 !== "1"');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);
    });

    it('evaluates binary not equals', function() {
        var expression = new Expression('\'hello\' != \'hello\'');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('1 != 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('false != true != false');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('1 != "1"');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('evaluates binary less than', function() {
        var expression = new Expression('2 < 3');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('2 < 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('3 < 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('true < false');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('color(\'blue\') < 10');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('evaluates binary less than or equals', function() {
        var expression = new Expression('2 <= 3');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('2 <= 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('3 <= 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('true <= false');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('color(\'blue\') <= 10');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('evaluates binary greater than', function() {
        var expression = new Expression('2 > 3');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('2 > 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('3 > 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('true > false');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('color(\'blue\') > 10');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('evaluates binary greater than or equals', function() {
        var expression = new Expression('2 >= 3');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('2 >= 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('3 >= 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('true >= false');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('color(\'blue\') >= 10');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('evaluates logical and', function() {
        var expression = new Expression('false && false');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('false && true');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('true && true');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('2 && color(\'red\')');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();
    });

    it('throws with invalid and operands', function() {
        var expression = new Expression('2 && true');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('true && color(\'red\')');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();
    });

    it('evaluates logical or', function() {
        var expression = new Expression('false || false');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('false || true');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('true || true');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);
    });

    it('throws with invalid or operands', function() {
        var expression = new Expression('2 || false');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expression = new Expression('false || color(\'red\')');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();
    });

    it('evaluates color operations', function() {
        var expression = new Expression('+rgba(255, 0, 0, 1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.RED));

        expression = new Expression('rgba(255, 0, 0, 0.5) + rgba(0, 0, 255, 0.5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.MAGENTA));

        expression = new Expression('rgba(0, 255, 255, 1.0) - rgba(0, 255, 0, 0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.BLUE));

        expression = new Expression('rgba(255, 255, 255, 1.0) * rgba(255, 0, 0, 1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.RED));

        expression = new Expression('rgba(255, 255, 0, 1.0) * 1.0');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.YELLOW));

        expression = new Expression('1 * rgba(255, 255, 0, 1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.YELLOW));

        expression = new Expression('rgba(255, 255, 255, 1.0) / rgba(255, 255, 255, 1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(Color.WHITE));

        expression = new Expression('rgba(255, 255, 255, 1.0) / 2');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(new Color(0.5, 0.5, 0.5, 0.5)));

        expression = new Expression('rgba(255, 255, 255, 1.0) % rgba(255, 255, 255, 1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Cartesian4.fromColor(new Color(0, 0, 0, 0)));

        expression = new Expression('color(\'green\') == color(\'green\')');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('color() == color()');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('!!color() == true');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('color(\'green\') != color(\'green\')');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('color(\'green\') !== color(\'green\')');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('evaluates vector operations', function() {
        var expression = new Expression('+vec2(1, 2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(1, 2));

        expression = new Expression('+vec3(1, 2, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(1, 2, 3));

        expression = new Expression('+vec4(1, 2, 3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(1, 2, 3, 4));

        expression = new Expression('-vec2(1, 2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(-1, -2));

        expression = new Expression('-vec3(1, 2, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(-1, -2, -3));

        expression = new Expression('-vec4(1, 2, 3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(-1, -2, -3, -4));

        expression = new Expression('vec2(1, 2) + vec2(3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(4, 6));

        expression = new Expression('vec3(1, 2, 3) + vec3(3, 4, 5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(4, 6, 8));

        expression = new Expression('vec4(1, 2, 3, 4) + vec4(3, 4, 5, 6)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(4, 6, 8, 10));

        expression = new Expression('vec2(1, 2) - vec2(3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(-2, -2));

        expression = new Expression('vec3(1, 2, 3) - vec3(3, 4, 5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(-2, -2, -2));

        expression = new Expression('vec4(1, 2, 3, 4) - vec4(3, 4, 5, 6)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(-2, -2, -2, -2));

        expression = new Expression('vec2(1, 2) * vec2(3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(3, 8));

        expression = new Expression('vec2(1, 2) * 3.0');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(3, 6));

        expression = new Expression('3.0 * vec2(1, 2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(3, 6));

        expression = new Expression('vec3(1, 2, 3) * vec3(3, 4, 5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(3, 8, 15));

        expression = new Expression('vec3(1, 2, 3) * 3.0');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(3, 6, 9));

        expression = new Expression('3.0 * vec3(1, 2, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(3, 6, 9));

        expression = new Expression('vec4(1, 2, 3, 4) * vec4(3, 4, 5, 6)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3, 8, 15, 24));

        expression = new Expression('vec4(1, 2, 3, 4) * 3.0');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3, 6, 9, 12));

        expression = new Expression('3.0 * vec4(1, 2, 3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(3, 6, 9, 12));

        expression = new Expression('vec2(1, 2) / vec2(2, 5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(0.5, 0.4));

        expression = new Expression('vec2(1, 2) / 2.0');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(0.5, 1.0));

        expression = new Expression('vec3(1, 2, 3) / vec3(2, 5, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(0.5, 0.4, 1.0));

        expression = new Expression('vec3(1, 2, 3) / 2.0');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(0.5, 1.0, 1.5));

        expression = new Expression('vec4(1, 2, 3, 4) / vec4(2, 5, 3, 2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(0.5, 0.4, 1.0, 2.0));

        expression = new Expression('vec4(1, 2, 3, 4) / 2.0');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(0.5, 1.0, 1.5, 2.0));

        expression = new Expression('vec2(2, 3) % vec2(3, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(2, 0));

        expression = new Expression('vec3(2, 3, 4) % vec3(3, 3, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(2, 0, 1));

        expression = new Expression('vec4(2, 3, 4, 5) % vec4(3, 3, 3, 2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(2, 0, 1, 1));

        expression = new Expression('vec2(1, 3) == vec2(1, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('vec3(1, 3, 4) == vec3(1, 3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('vec4(1, 3, 4, 6) == vec4(1, 3, 4, 6)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('vec2(1, 2) === vec2(1, 2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('vec3(1, 2, 3) === vec3(1, 2, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('vec4(1, 2, 3, 4) === vec4(1, 2, 3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('!!vec4(1.0) == true');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('vec2(1, 2) != vec2(1, 2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('vec3(1, 2, 3) != vec3(1, 2, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('vec4(1, 2, 3, 4) != vec4(1, 2, 3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('vec2(1, 2) !== vec2(1, 2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('vec3(1, 2, 3) !== vec3(1, 2, 3)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('vec4(1, 2, 3, 4) !== vec4(1, 2, 3, 4)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('evaluates color toString function', function() {
        var expression = new Expression('color("red").toString()');
        expect(expression.evaluate(frameState, undefined)).toEqual('(1, 0, 0, 1)');

        expression = new Expression('rgba(0, 0, 255, 0.5).toString()');
        expect(expression.evaluate(frameState, undefined)).toEqual('(0, 0, 1, 0.5)');
    });

    it('evaluates vector toString function', function() {
        var feature = new MockFeature();
        feature.addProperty('property', new Cartesian4(1, 2, 3, 4));

        var expression = new Expression('vec2(1, 2).toString()');
        expect(expression.evaluate(frameState, undefined)).toEqual('(1, 2)');

        expression = new Expression('vec3(1, 2, 3).toString()');
        expect(expression.evaluate(frameState, undefined)).toEqual('(1, 2, 3)');

        expression = new Expression('vec4(1, 2, 3, 4).toString()');
        expect(expression.evaluate(frameState, undefined)).toEqual('(1, 2, 3, 4)');

        expression = new Expression('${property}.toString()');
        expect(expression.evaluate(frameState, feature)).toEqual('(1, 2, 3, 4)');
    });

    it('evaluates isNaN function', function() {
        var expression = new Expression('isNaN()');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('isNaN(NaN)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('isNaN(1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('isNaN(Infinity)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('isNaN(null)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('isNaN(true)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('isNaN("hello")');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('isNaN(color("white"))');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);
    });

    it('evaluates isFinite function', function() {
        var expression = new Expression('isFinite()');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('isFinite(NaN)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('isFinite(1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('isFinite(Infinity)');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('isFinite(null)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('isFinite(true)');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('isFinite("hello")');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('isFinite(color("white"))');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);
    });

    it('evaluates isExactClass function', function() {
        var feature = new MockFeature();
        feature.setClass('door');

        var expression = new Expression('isExactClass("door")');
        expect(expression.evaluate(frameState, feature)).toEqual(true);

        expression = new Expression('isExactClass("roof")');
        expect(expression.evaluate(frameState, feature)).toEqual(false);
    });

    it('throws if isExactClass takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('isExactClass()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('isExactClass("door", "roof")');
        }).toThrowDeveloperError();
    });

    it('evaluates isClass function', function() {
        var feature = new MockFeature();

        feature.setClass('door');
        feature.setInheritedClass('building');

        var expression = new Expression('isClass("door") && isClass("building")');
        expect(expression.evaluate(frameState, feature)).toEqual(true);
    });

    it('throws if isClass takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('isClass()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('isClass("door", "building")');
        }).toThrowDeveloperError();
    });

    it('evaluates getExactClassName function', function() {
        var feature = new MockFeature();
        feature.setClass('door');
        var expression = new Expression('getExactClassName()');
        expect(expression.evaluate(frameState, feature)).toEqual('door');
    });

    it('throws if getExactClassName takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('getExactClassName("door")');
        }).toThrowDeveloperError();
    });

    it('evaluates abs function', function() {
        var expression = new Expression('abs(-1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('abs(1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('abs(vec2(-1.0, 1.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(1.0, 1.0));

        expression = new Expression('abs(vec3(-1.0, 1.0, 0.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(1.0, 1.0, 0.0));

        expression = new Expression('abs(vec4(-1.0, 1.0, 0.0, -1.2))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(1.0, 1.0, 0.0, 1.2));
    });

    it('throws if abs function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('abs()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('abs(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates cos function', function() {
        var expression = new Expression('cos(0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('cos(vec2(0, PI))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian2(1.0, -1.0), CesiumMath.EPSILON7);

        expression = new Expression('cos(vec3(0, PI, -PI)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian3(1.0, -1.0, -1.0), CesiumMath.EPSILON7);

        expression = new Expression('cos(vec4(0, PI, -PI, 0)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian4(1.0, -1.0, -1.0, 1.0), CesiumMath.EPSILON7);
    });

    it('throws if cos function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('cos()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('cos(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates sin function', function() {
        var expression = new Expression('sin(0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);

        expression = new Expression('sin(vec2(0, PI/2))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian2(0.0, 1.0), CesiumMath.EPSILON7);

        expression = new Expression('sin(vec3(0, PI/2, -PI/2)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian3(0.0, 1.0, -1.0), CesiumMath.EPSILON7);

        expression = new Expression('sin(vec4(0, PI/2, -PI/2, 0)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian4(0.0, 1.0, -1.0, 0.0), CesiumMath.EPSILON7);
    });

    it('throws if sin function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('sin()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('sin(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates tan function', function() {
        var expression = new Expression('tan(0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);

        expression = new Expression('tan(vec2(0, PI/4))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian2(0.0, 1.0), CesiumMath.EPSILON7);

        expression = new Expression('tan(vec3(0, PI/4, PI)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian3(0.0, 1.0, 0.0), CesiumMath.EPSILON7);

        expression = new Expression('tan(vec4(0, PI/4, PI, -PI/4)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian4(0.0, 1.0, 0.0, -1.0), CesiumMath.EPSILON7);
    });

    it('throws if tan function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('tan()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('tan(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates acos function', function() {
        var expression = new Expression('acos(1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);

        expression = new Expression('acos(vec2(1, 0))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian2(0.0, CesiumMath.PI_OVER_TWO), CesiumMath.EPSILON7);

        expression = new Expression('acos(vec3(1, 0, 1)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian3(0.0, CesiumMath.PI_OVER_TWO, 0.0, CesiumMath.PI_OVER_TWO), CesiumMath.EPSILON7);

        expression = new Expression('acos(vec4(1, 0, 1, 0)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian4(0.0, CesiumMath.PI_OVER_TWO, 0.0, CesiumMath.PI_OVER_TWO, 0.0), CesiumMath.EPSILON7);
    });

    it('throws if acos function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('acos()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('acos(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates asin function', function() {
        var expression = new Expression('asin(0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);

        expression = new Expression('asin(vec2(0, 1))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian2(0.0, CesiumMath.PI_OVER_TWO), CesiumMath.EPSILON7);

        expression = new Expression('asin(vec3(0, 1, 0)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian3(0.0, CesiumMath.PI_OVER_TWO, 0.0, CesiumMath.PI_OVER_TWO), CesiumMath.EPSILON7);

        expression = new Expression('asin(vec4(0, 1, 0, 1)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian4(0.0, CesiumMath.PI_OVER_TWO, 0.0, CesiumMath.PI_OVER_TWO, 0.0), CesiumMath.EPSILON7);
    });

    it('throws if asin function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('asin()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('asin(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates atan function', function() {
        var expression = new Expression('atan(0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);

        expression = new Expression('atan(vec2(0, 1))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian2(0.0, CesiumMath.PI_OVER_FOUR), CesiumMath.EPSILON7);

        expression = new Expression('atan(vec3(0, 1, 0)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian3(0.0, CesiumMath.PI_OVER_FOUR, 0.0, CesiumMath.PI_OVER_FOUR), CesiumMath.EPSILON7);

        expression = new Expression('atan(vec4(0, 1, 0, 1)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian4(0.0, CesiumMath.PI_OVER_FOUR, 0.0, CesiumMath.PI_OVER_FOUR, 0.0), CesiumMath.EPSILON7);
    });

    it('throws if atan function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('atan()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('atan(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates radians function', function() {
        var expression = new Expression('radians(180)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(Math.PI, CesiumMath.EPSILON10);

        expression = new Expression('radians(vec2(180, 90))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian2(Math.PI, CesiumMath.PI_OVER_TWO), CesiumMath.EPSILON7);

        expression = new Expression('radians(vec3(180, 90, 180))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian3(Math.PI, CesiumMath.PI_OVER_TWO, Math.PI), CesiumMath.EPSILON7);

        expression = new Expression('radians(vec4(180, 90, 180, 90)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian4(Math.PI, CesiumMath.PI_OVER_TWO, Math.PI, CesiumMath.PI_OVER_TWO), CesiumMath.EPSILON7);
    });

    it('throws if radians function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('radians()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('radians(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates degrees function', function() {
        var expression = new Expression('degrees(2 * PI)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(360, CesiumMath.EPSILON10);

        expression = new Expression('degrees(vec2(2 * PI, PI))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian2(360, 180), CesiumMath.EPSILON7);

        expression = new Expression('degrees(vec3(2 * PI, PI, 2 * PI))');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian3(360, 180, 360), CesiumMath.EPSILON7);

        expression = new Expression('degrees(vec4(2 * PI, PI, 2 * PI, PI)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(new Cartesian4(360, 180, 360, 180), CesiumMath.EPSILON7);
    });

    it('throws if degrees function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('degrees()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('degrees(1, 2)');
        });
    });

    it('evaluates sqrt function', function() {
        var expression = new Expression('sqrt(1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('sqrt(4.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(2.0);

        expression = new Expression('sqrt(-1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(NaN);

        expression = new Expression('sqrt(vec2(1.0, 4.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(1.0, 2.0));

        expression = new Expression('sqrt(vec3(1.0, 4.0, 9.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(1.0, 2.0, 3.0));

        expression = new Expression('sqrt(vec4(1.0, 4.0, 9.0, 16.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(1.0, 2.0, 3.0, 4.0));
    });

    it('throws if sqrt function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('sqrt()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('sqrt(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates sign function', function() {
        var expression = new Expression('sign(5.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('sign(0.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.0);

        expression = new Expression('sign(-5.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(-1.0);

        expression = new Expression('sign(vec2(5.0, -5.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(1.0, -1.0));

        expression = new Expression('sign(vec3(5.0, -5.0, 0.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(1.0, -1.0, 0.0));

        expression = new Expression('sign(vec4(5.0, -5.0, 0.0, 1.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(1.0, -1.0, 0.0, 1.0));
    });

    it('throws if sign function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('sign()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('sign(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates floor function', function() {
        var expression = new Expression('floor(5.5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(5.0);

        expression = new Expression('floor(0.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.0);

        expression = new Expression('floor(-1.2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(-2.0);

        expression = new Expression('floor(vec2(5.5, -1.2))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(5.0, -2.0));

        expression = new Expression('floor(vec3(5.5, -1.2, 0.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(5.0, -2.0, 0.0));

        expression = new Expression('floor(vec4(5.5, -1.2, 0.0, -2.9))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(5.0, -2.0, 0.0, -3.0));
    });

    it('throws if floor function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('floor()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('floor(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates ceil function', function() {
        var expression = new Expression('ceil(5.5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(6.0);

        expression = new Expression('ceil(0.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.0);

        expression = new Expression('ceil(-1.2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(-1.0);

        expression = new Expression('ceil(vec2(5.5, -1.2))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(6.0, -1.0));

        expression = new Expression('ceil(vec3(5.5, -1.2, 0.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(6.0, -1.0, 0.0));

        expression = new Expression('ceil(vec4(5.5, -1.2, 0.0, -2.9))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(6.0, -1.0, 0.0, -2.0));
    });

    it('throws if ceil function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('ceil()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('ceil(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates round function', function() {
        var expression = new Expression('round(5.5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(6);

        expression = new Expression('round(0.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0);

        expression = new Expression('round(1.2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1);

        expression = new Expression('round(vec2(5.5, -1.2))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(6.0, -1.0));

        expression = new Expression('round(vec3(5.5, -1.2, 0.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(6.0, -1.0, 0.0));

        expression = new Expression('round(vec4(5.5, -1.2, 0.0, -2.9))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(6.0, -1.0, 0.0, -3.0));
    });

    it('throws if round function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('round()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('round(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates exp function', function() {
        var expression = new Expression('exp(1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(Math.E);

        expression = new Expression('exp(0.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('exp(vec2(1.0, 0.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(Math.E, 1.0));

        expression = new Expression('exp(vec3(1.0, 0.0, 1.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(Math.E, 1.0, Math.E));

        expression = new Expression('exp(vec4(1.0, 0.0, 1.0, 0.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(Math.E, 1.0, Math.E, 1.0));
    });

    it('throws if exp function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('exp()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('exp(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates exp2 function', function() {
        var expression = new Expression('exp2(1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(2.0);

        expression = new Expression('exp2(0.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('exp2(2.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(4.0);

        expression = new Expression('exp2(vec2(1.0, 0.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(2.0, 1.0));

        expression = new Expression('exp2(vec3(1.0, 0.0, 2.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(2.0, 1.0, 4.0));

        expression = new Expression('exp2(vec4(1.0, 0.0, 2.0, 3.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(2.0, 1.0, 4.0, 8.0));
    });

    it('throws if exp2 function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('exp2()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('exp2(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates log function', function() {
        var expression = new Expression('log(1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.0);

        expression = new Expression('log(10.0)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(2.302585092994046, CesiumMath.EPSILON7);

        expression = new Expression('log(vec2(1.0, E))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(0.0, 1.0));

        expression = new Expression('log(vec3(1.0, E, 1.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(0.0, 1.0, 0.0));

        expression = new Expression('log(vec4(1.0, E, 1.0, E))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(0.0, 1.0, 0.0, 1.0));
    });

    it('throws if log function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('log()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('log(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates log2 function', function() {
        var expression = new Expression('log2(1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.0);

        expression = new Expression('log2(2.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('log2(4.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(2.0);

        expression = new Expression('log2(vec2(1.0, 2.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(0.0, 1.0));

        expression = new Expression('log2(vec3(1.0, 2.0, 4.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(0.0, 1.0, 2.0));

        expression = new Expression('log2(vec4(1.0, 2.0, 4.0, 8.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(0.0, 1.0, 2.0, 3.0));
    });

    it('throws if log2 function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('log2()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('log2(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates fract function', function() {
        var expression = new Expression('fract(1.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.0);

        expression = new Expression('fract(2.25)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.25);

        expression = new Expression('fract(-2.25)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.75);

        expression = new Expression('fract(vec2(1.0, 2.25))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian2(0.0, 0.25));

        expression = new Expression('fract(vec3(1.0, 2.25, -2.25))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian3(0.0, 0.25, 0.75));

        expression = new Expression('fract(vec4(1.0, 2.25, -2.25, 1.0))');
        expect(expression.evaluate(frameState, undefined)).toEqual(new Cartesian4(0.0, 0.25, 0.75, 0.0));
    });

    it('throws if fract function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('log2()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('log2(1, 2)');
        }).toThrowDeveloperError();
    });

    it('evaluates clamp function', function() {
        var expression = new Expression('clamp(50.0, 0.0, 100.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(50.0);

        expression = new Expression('clamp(50.0, 0.0, 25.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(25.0);

        expression = new Expression('clamp(50.0, 75.0, 100.0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(75.0);
    });

    it('throws if clamp function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('clamp()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('clamp(1)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('clamp(1, 2)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('clamp(1, 2, 3, 4)');
        }).toThrowDeveloperError();
    });

    it('evaluates mix function', function() {
        var expression = new Expression('mix(0.0, 2.0, 0.5)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);
    });

    it('throws if mix function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('mix()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('mix(1)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('mix(1, 2)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('mix(1, 2, 3, 4)');
        }).toThrowDeveloperError();
    });

    it('evaluates atan2 function', function() {
        var expression = new Expression('atan2(0,1)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(0.0, CesiumMath.EPSILON10);

        expression = new Expression('atan2(1,0)');
        expect(expression.evaluate(frameState, undefined)).toEqualEpsilon(0.5*Math.PI, CesiumMath.EPSILON10);
    });

    it('throws if atan2 function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('atan2(0.0)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('atan2(1, 2, 0)');
        }).toThrowDeveloperError();
    });

    it('evaluates pow function', function() {
        var expression = new Expression('pow(5,0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('pow(4,2)');
        expect(expression.evaluate(frameState, undefined)).toEqual(16.0);
    });

    it('throws if pow function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('pow(0.0)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('pow(1, 2, 0)');
        }).toThrowDeveloperError();
    });

    it('evaluates min function', function() {
        var expression = new Expression('min(0,1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.0);

        expression = new Expression('min(-1,0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(-1.0);
    });

    it('throws if min function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('min(0.0)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('min(1, 2, 0)');
        }).toThrowDeveloperError();
    });

    it('evaluates max function', function() {
        var expression = new Expression('max(0,1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(1.0);

        expression = new Expression('max(-1,0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(0.0);
    });

    it('throws if max function takes an invalid number of arguments', function() {
        expect(function() {
            return new Expression('max(0.0)');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('max(1, 2, 0)');
        }).toThrowDeveloperError();
    });

    it('evaluates ternary conditional', function() {
        var expression = new Expression('true ? "first" : "second"');
        expect(expression.evaluate(frameState, undefined)).toEqual('first');

        expression = new Expression('false ? "first" : "second"');
        expect(expression.evaluate(frameState, undefined)).toEqual('second');

        expression = new Expression('(!(1 + 2 > 3)) ? (2 > 1 ? 1 + 1 : 0) : (2 > 1 ? -1 + -1 : 0)');
        expect(expression.evaluate(frameState, undefined)).toEqual(2);
    });

    it('evaluates member expression with dot', function() {
        var feature = new MockFeature();
        feature.addProperty('height', 10);
        feature.addProperty('width', 5);
        feature.addProperty('string', 'hello');
        feature.addProperty('boolean', true);
        feature.addProperty('vector', Cartesian4.UNIT_X);
        feature.addProperty('vector.x', 'something else');
        feature.addProperty('feature.vector', Cartesian4.UNIT_Y);
        feature.addProperty('feature', {
            vector : Cartesian4.UNIT_Z
        });
        feature.addProperty('null', null);
        feature.addProperty('undefined', undefined);
        feature.addProperty('address', {
            "street" : "Example Street",
            "city" : "Example City"
        });

        var expression = new Expression('${vector.x}');
        expect(expression.evaluate(frameState, feature)).toEqual(1.0);

        expression = new Expression('${vector.z}');
        expect(expression.evaluate(frameState, feature)).toEqual(0.0);

        expression = new Expression('${height.z}');
        expect(expression.evaluate(frameState, feature)).toEqual(undefined);

        expression = new Expression('${undefined.z}');
        expect(expression.evaluate(frameState, feature)).toEqual(undefined);

        expression = new Expression('${feature}');
        expect(expression.evaluate(frameState, feature)).toEqual({
            vector : Cartesian4.UNIT_Z
        });

        expression = new Expression('${feature.vector}');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.UNIT_X);

        expression = new Expression('${feature.feature.vector}');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.UNIT_Z);

        expression = new Expression('${feature.vector.x}');
        expect(expression.evaluate(frameState, feature)).toEqual(1.0);

        expression = new Expression('${address.street}');
        expect(expression.evaluate(frameState, feature)).toEqual("Example Street");

        expression = new Expression('${address.city}');
        expect(expression.evaluate(frameState, feature)).toEqual("Example City");
    });

    it('evaluates member expression with brackets', function() {
        var feature = new MockFeature();
        feature.addProperty('height', 10);
        feature.addProperty('width', 5);
        feature.addProperty('string', 'hello');
        feature.addProperty('boolean', true);
        feature.addProperty('vector', Cartesian4.UNIT_X);
        feature.addProperty('vector.x', 'something else');
        feature.addProperty('feature.vector', Cartesian4.UNIT_Y);
        feature.addProperty('feature', {
            vector : Cartesian4.UNIT_Z
        });
        feature.addProperty('null', null);
        feature.addProperty('undefined', undefined);
        feature.addProperty('address.street', "Other Street");
        feature.addProperty('address', {
            "street" : "Example Street",
            "city" : "Example City"
        });

        var expression = new Expression('${vector["x"]}');
        expect(expression.evaluate(frameState, feature)).toEqual(1.0);

        expression = new Expression('${vector["z"]}');
        expect(expression.evaluate(frameState, feature)).toEqual(0.0);

        expression = new Expression('${height["z"]}');
        expect(expression.evaluate(frameState, feature)).toEqual(undefined);

        expression = new Expression('${undefined["z"]}');
        expect(expression.evaluate(frameState, feature)).toEqual(undefined);

        expression = new Expression('${feature["vector"]}');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.UNIT_X);

        expression = new Expression('${feature.vector["x"]}');
        expect(expression.evaluate(frameState, feature)).toEqual(1.0);

        expression = new Expression('${feature["vector"].x}');
        expect(expression.evaluate(frameState, feature)).toEqual(1.0);

        expression = new Expression('${feature["vector.x"]}');
        expect(expression.evaluate(frameState, feature)).toEqual('something else');

        expression = new Expression('${feature.feature["vector"]}');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.UNIT_Z);

        expression = new Expression('${feature["feature.vector"]}');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.UNIT_Y);

        expression = new Expression('${address.street}');
        expect(expression.evaluate(frameState, feature)).toEqual("Example Street");

        expression = new Expression('${feature.address.street}');
        expect(expression.evaluate(frameState, feature)).toEqual("Example Street");

        expression = new Expression('${feature["address"].street}');
        expect(expression.evaluate(frameState, feature)).toEqual("Example Street");

        expression = new Expression('${feature["address.street"]}');
        expect(expression.evaluate(frameState, feature)).toEqual("Other Street");

        expression = new Expression('${address["street"]}');
        expect(expression.evaluate(frameState, feature)).toEqual("Example Street");

        expression = new Expression('${address["city"]}');
        expect(expression.evaluate(frameState, feature)).toEqual("Example City");
    });

    it('member expressions throw without variable notation', function() {
        expect(function() {
            return new Expression('color.r');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('color["r"]');
        }).toThrowDeveloperError();
    });

    it('member expression throws with variable property', function() {
        var feature = new MockFeature();
        feature.addProperty('vector', Cartesian4.UNIT_X);
        feature.addProperty('vectorName', 'UNIT_X');

        expect(function() {
            return new Expression('${vector[${vectorName}]}');
        }).toThrowDeveloperError();
    });

    it('evaluates feature property', function() {
        var feature = new MockFeature();
        feature.addProperty('feature', {
            vector : Cartesian4.UNIT_X
        });

        var expression = new Expression('${feature}');
        expect(expression.evaluate(frameState, feature)).toEqual({
            vector : Cartesian4.UNIT_X
        });

        expression = new Expression('${feature} == ${feature.feature}');
        expect(expression.evaluate(frameState, feature)).toEqual(true);
    });

    it('constructs regex', function() {
        var feature = new MockFeature();
        feature.addProperty('pattern', "[abc]");

        var expression = new Expression('regExp("a")');
        expect(expression.evaluate(frameState, undefined)).toEqual(/a/);
        expect(expression._runtimeAst._type).toEqual(ExpressionNodeType.LITERAL_REGEX);

        expression = new Expression('regExp("\\w")');
        expect(expression.evaluate(frameState, undefined)).toEqual(/\w/);
        expect(expression._runtimeAst._type).toEqual(ExpressionNodeType.LITERAL_REGEX);

        expression = new Expression('regExp(1 + 1)');
        expect(expression.evaluate(frameState, undefined)).toEqual(/2/);
        expect(expression._runtimeAst._type).toEqual(ExpressionNodeType.REGEX);

        expression = new Expression('regExp(true)');
        expect(expression.evaluate(frameState, undefined)).toEqual(/true/);
        expect(expression._runtimeAst._type).toEqual(ExpressionNodeType.LITERAL_REGEX);

        expression = new Expression('regExp()');
        expect(expression.evaluate(frameState, undefined)).toEqual(/(?:)/);
        expect(expression._runtimeAst._type).toEqual(ExpressionNodeType.LITERAL_REGEX);

        expression = new Expression('regExp(${pattern})');
        expect(expression.evaluate(frameState, feature)).toEqual(/[abc]/);
        expect(expression._runtimeAst._type).toEqual(ExpressionNodeType.REGEX);
    });

    it ('constructs regex with flags', function() {
        var expression = new Expression('regExp("a", "i")');
        expect(expression.evaluate(frameState, undefined)).toEqual(/a/i);
        expect(expression._runtimeAst._type).toEqual(ExpressionNodeType.LITERAL_REGEX);

        expression = new Expression('regExp("a", "m" + "g")');
        expect(expression.evaluate(frameState, undefined)).toEqual(/a/mg);
        expect(expression._runtimeAst._type).toEqual(ExpressionNodeType.REGEX);
    });

    it('throws if regex constructor has invalid pattern', function() {
        var expression = new Expression('regExp("(?<=\\s)" + ".")');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('regExp("(?<=\\s)")');
        }).toThrowDeveloperError();
    });

    it('throws if regex constructor has invalid flags', function() {
        var expression = new Expression('regExp("a" + "b", "q")');
        expect(function() {
            expression.evaluate(frameState, undefined);
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('regExp("a", "q")');
        }).toThrowDeveloperError();
    });

    it('evaluates regex test function', function() {
        var feature = new MockFeature();
        feature.addProperty('property', 'abc');

        var expression = new Expression('regExp("a").test("abc")');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('regExp("a").test("bcd")');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('regExp("quick\\s(brown).+?(jumps)", "ig").test("The Quick Brown Fox Jumps Over The Lazy Dog")');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('regExp("a").test()');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('regExp(${property}).test(${property})');
        expect(expression.evaluate(frameState, feature)).toEqual(true);
    });

    it('evaluates regex exec function', function() {
        var feature = new MockFeature();
        feature.addProperty('property', 'abc');
        feature.addProperty('Name', 'Building 1');

        var expression = new Expression('regExp("a(.)", "i").exec("Abc")');
        expect(expression.evaluate(frameState, undefined)).toEqual('b');

        expression = new Expression('regExp("a(.)").exec("qbc")');
        expect(expression.evaluate(frameState, undefined)).toEqual(null);

        expression = new Expression('regExp("a(.)").exec()');
        expect(expression.evaluate(frameState, undefined)).toEqual(null);

        expression = new Expression('regExp("quick\\s(b.*n).+?(jumps)", "ig").exec("The Quick Brown Fox Jumps Over The Lazy Dog")');
        expect(expression.evaluate(frameState, undefined)).toEqual('Brown');

        expression = new Expression('regExp("(" + ${property} + ")").exec(${property})');
        expect(expression.evaluate(frameState, feature)).toEqual('abc');

        expression = new Expression('regExp("Building\\s(\\d)").exec(${Name})');
        expect(expression.evaluate(frameState, feature)).toEqual('1');
    });

    it('evaluates regex match operator', function() {
        var feature = new MockFeature();
        feature.addProperty('property', 'abc');

        var expression = new Expression('regExp("a") =~ "abc"');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('"abc" =~ regExp("a")');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('regExp("a") =~ "bcd"');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('"bcd" =~ regExp("a")');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('regExp("quick\\s(brown).+?(jumps)", "ig") =~ "The Quick Brown Fox Jumps Over The Lazy Dog"');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('regExp("a") =~ 1');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('1 =~ regExp("a")');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('1 =~ 1');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('regExp(${property}) =~ ${property}');
        expect(expression.evaluate(frameState, feature)).toEqual(true);
    });

    it('evaluates regex not match operator', function() {
        var feature = new MockFeature();
        feature.addProperty('property', 'abc');

        var expression = new Expression('regExp("a") !~ "abc"');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('"abc" !~ regExp("a")');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('regExp("a") !~ "bcd"');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('"bcd" !~ regExp("a")');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('regExp("quick\\s(brown).+?(jumps)", "ig") !~ "The Quick Brown Fox Jumps Over The Lazy Dog"');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('regExp("a") !~ 1');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('1 !~ regExp("a")');
        expect(expression.evaluate(frameState, undefined)).toEqual(true);

        expression = new Expression('1 !~ 1');
        expect(expression.evaluate(frameState, undefined)).toEqual(false);

        expression = new Expression('regExp(${property}) !~ ${property}');
        expect(expression.evaluate(frameState, feature)).toEqual(false);
    });

    it('throws if test is not called with a RegExp', function() {
        expect(function() {
            return new Expression('color("blue").test()');
        }).toThrowDeveloperError();

        expect(function() {
            return new Expression('"blue".test()');
        }).toThrowDeveloperError();
    });

    it('evaluates regExp toString function', function() {
        var feature = new MockFeature();
        feature.addProperty('property', 'abc');

        var expression = new Expression('regExp().toString()');
        expect(expression.evaluate(frameState, undefined)).toEqual('/(?:)/');

        expression = new Expression('regExp("\\d\\s\\d", "ig").toString()');
        expect(expression.evaluate(frameState, undefined)).toEqual('/\\d\\s\\d/gi');

        expression = new Expression('regExp(${property}).toString()');
        expect(expression.evaluate(frameState, feature)).toEqual('/abc/');
    });

    it('throws when using toString on other type', function() {
        var feature = new MockFeature();
        feature.addProperty('property', 'abc');

        var expression = new Expression('${property}.toString()');
        expect(function() {
            return expression.evaluate(frameState, feature);
        }).toThrowDeveloperError();
    });

    it('evaluates array expression', function() {
        var feature = new MockFeature();
        feature.addProperty('property', 'value');
        feature.addProperty('array', [Cartesian4.UNIT_X, Cartesian4.UNIT_Y, Cartesian4.UNIT_Z]);
        feature.addProperty('complicatedArray', [{
            'subproperty' : Cartesian4.UNIT_X,
            'anotherproperty' : Cartesian4.UNIT_Y
         }, {
            'subproperty' : Cartesian4.UNIT_Z,
            'anotherproperty' : Cartesian4.UNIT_W
        }]);
        feature.addProperty('temperatures', {
            "scale" : "fahrenheit",
            "values" : [70, 80, 90]
        });

        var expression = new Expression('[1, 2, 3]');
        expect(expression.evaluate(frameState, undefined)).toEqual([1, 2, 3]);

        expression = new Expression('[1+2, "hello", 2 < 3, color("blue"), ${property}]');
        expect(expression.evaluate(frameState, feature)).toEqual([3, 'hello', true, Cartesian4.fromColor(Color.BLUE), 'value']);

        expression = new Expression('[1, 2, 3] * 4');
        expect(expression.evaluate(frameState, undefined)).toEqual(NaN);

        expression = new Expression('-[1, 2, 3]');
        expect(expression.evaluate(frameState, undefined)).toEqual(NaN);

        expression = new Expression('${array[1]}');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.UNIT_Y);

        expression = new Expression('${complicatedArray[1].subproperty}');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.UNIT_Z);

        expression = new Expression('${complicatedArray[0]["anotherproperty"]}');
        expect(expression.evaluate(frameState, feature)).toEqual(Cartesian4.UNIT_Y);

        expression = new Expression('${temperatures["scale"]}');
        expect(expression.evaluate(frameState, feature)).toEqual('fahrenheit');

        expression = new Expression('${temperatures.values[0]}');
        expect(expression.evaluate(frameState, feature)).toEqual(70);

        expression = new Expression('${temperatures["values"][0]}');
        expect(expression.evaluate(frameState, feature)).toEqual(70);
    });

    it('evaluates TILES3D_TILESET_TIME expression', function() {
        var feature = new MockFeature();
        var expression = new Expression('TILES3D_TILESET_TIME');
        expect(expression.evaluate(frameState, feature)).toEqual(0.0);
        feature._content._tileset.timeSinceLoad = 1.0;
        expect(expression.evaluate(frameState, feature)).toEqual(1.0);
    });

    it('gets shader function', function() {
        var expression = new Expression('true');
        var shaderFunction = expression.getShaderFunction('getShow', '', {}, 'bool');
        var expected = 'bool getShow() \n' +
                       '{ \n' +
                       '    return true; \n' +
                       '} \n';
        expect(shaderFunction).toEqual(expected);
    });

    it('gets shader expression for variable', function() {
        var expression = new Expression('${property}');
        var shaderExpression = expression.getShaderExpression('prefix_', {});
        var expected = 'prefix_property';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for unary not', function() {
        var expression = new Expression('!true');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '!true';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for unary negative', function() {
        var expression = new Expression('-5.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '-5.0';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for unary positive', function() {
        var expression = new Expression('+5.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '+5.0';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for converting to literal boolean', function() {
        var expression = new Expression('Boolean(1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'bool(1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for converting to literal number', function() {
        var expression = new Expression('Number(true)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'float(true)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary addition', function() {
        var expression = new Expression('1.0 + 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 + 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary subtraction', function() {
        var expression = new Expression('1.0 - 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 - 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary multiplication', function() {
        var expression = new Expression('1.0 * 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 * 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary division', function() {
        var expression = new Expression('1.0 / 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 / 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary modulus', function() {
        var expression = new Expression('1.0 % 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'mod(1.0, 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary equals strict', function() {
        var expression = new Expression('1.0 === 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 == 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary equals', function() {
        var expression = new Expression('1.0 == 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 == 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary not equals strict', function() {
        var expression = new Expression('1.0 !== 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 != 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary not equals', function() {
        var expression = new Expression('1.0 != 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 != 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary less than', function() {
        var expression = new Expression('1.0 < 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 < 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary less than or equals', function() {
        var expression = new Expression('1.0 <= 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 <= 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary greater than', function() {
        var expression = new Expression('1.0 > 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 > 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for binary greater than or equals', function() {
        var expression = new Expression('1.0 >= 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(1.0 >= 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for logical and', function() {
        var expression = new Expression('true && false');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(true && false)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for logical or', function() {
        var expression = new Expression('true || false');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(true || false)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for ternary conditional', function() {
        var expression = new Expression('true ? 1.0 : 2.0');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(true ? 1.0 : 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for array indexing', function() {
        var expression = new Expression('${property[0]}');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'property[0]';
        expect(shaderExpression).toEqual(expected);

        expression = new Expression('${property[4 / 2]}');
        shaderExpression = expression.getShaderExpression('', {});
        expected = 'property[int((4.0 / 2.0))]';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for array', function() {
        var expression = new Expression('[1.0, 2.0]');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'vec2(1.0, 2.0)';
        expect(shaderExpression).toEqual(expected);

        expression = new Expression('[1.0, 2.0, 3.0]');
        shaderExpression = expression.getShaderExpression('', {});
        expected = 'vec3(1.0, 2.0, 3.0)';
        expect(shaderExpression).toEqual(expected);

        expression = new Expression('[1.0, 2.0, 3.0, 4.0]');
        shaderExpression = expression.getShaderExpression('', {});
        expected = 'vec4(1.0, 2.0, 3.0, 4.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('throws when getting shader expression for array of invalid length', function() {
        var expression = new Expression('[]');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();

        expression = new Expression('[1.0]');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();

        expression = new Expression('[1.0, 2.0, 3.0, 4.0, 5.0]');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('gets shader expression for boolean', function() {
        var expression = new Expression('true || false');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(true || false)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for integer', function() {
        var expression = new Expression('1');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '1.0';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for float', function() {
        var expression = new Expression('1.02');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '1.02';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for color', function() {
        var shaderState = {translucent : false};
        var expression = new Expression('color()');
        var shaderExpression = expression.getShaderExpression('', shaderState);
        var expected = 'vec4(1.0)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(false);

        shaderState = {translucent : false};
        expression = new Expression('color("red")');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(vec3(1.0, 0.0, 0.0), 1.0)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(false);

        shaderState = {translucent : false};
        expression = new Expression('color("#FFF")');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(vec3(1.0, 1.0, 1.0), 1.0)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(false);

        shaderState = {translucent : false};
        expression = new Expression('color("#FF0000")');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(vec3(1.0, 0.0, 0.0), 1.0)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(false);

        shaderState = {translucent : false};
        expression = new Expression('color("rgb(255, 0, 0)")');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(vec3(1.0, 0.0, 0.0), 1.0)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(false);

        shaderState = {translucent : false};
        expression = new Expression('color("red", 0.5)');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(vec3(1.0, 0.0, 0.0), 0.5)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(true);

        shaderState = {translucent : false};
        expression = new Expression('rgb(255, 0, 0)');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(1.0, 0.0, 0.0, 1.0)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(false);

        shaderState = {translucent : false};
        expression = new Expression('rgb(255, ${property}, 0)');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(255.0 / 255.0, property / 255.0, 0.0 / 255.0, 1.0)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(false);

        shaderState = {translucent : false};
        expression = new Expression('rgba(255, 0, 0, 0.5)');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(1.0, 0.0, 0.0, 0.5)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(true);

        shaderState = {translucent : false};
        expression = new Expression('rgba(255, ${property}, 0, 0.5)');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(255.0 / 255.0, property / 255.0, 0.0 / 255.0, 0.5)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(true);

        shaderState = {translucent : false};
        expression = new Expression('hsl(1.0, 0.5, 0.5)');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(0.75, 0.25, 0.25, 1.0)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(false);

        shaderState = {translucent : false};
        expression = new Expression('hsla(1.0, 0.5, 0.5, 0.5)');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(0.75, 0.25, 0.25, 0.5)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(true);

        shaderState = {translucent : false};
        expression = new Expression('hsl(1.0, ${property}, 0.5)');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(czm_HSLToRGB(vec3(1.0, property, 0.5)), 1.0)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(false);

        shaderState = {translucent : false};
        expression = new Expression('hsla(1.0, ${property}, 0.5, 0.5)');
        shaderExpression = expression.getShaderExpression('', shaderState);
        expected = 'vec4(czm_HSLToRGB(vec3(1.0, property, 0.5)), 0.5)';
        expect(shaderExpression).toEqual(expected);
        expect(shaderState.translucent).toBe(true);
    });

    it('gets shader expression for color components', function() {
        // .r, .g, .b, .a
        var expression = new Expression('color().r + color().g + color().b + color().a');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(((vec4(1.0)[0] + vec4(1.0)[1]) + vec4(1.0)[2]) + vec4(1.0)[3])';
        expect(shaderExpression).toEqual(expected);

        // .x, .y, .z, .w
        expression = new Expression('color().x + color().y + color().z + color().w');
        shaderExpression = expression.getShaderExpression('', {});
        expect(shaderExpression).toEqual(expected);

        // [0], [1], [2], [3]
        expression = new Expression('color()[0] + color()[1] + color()[2] + color()[3]');
        shaderExpression = expression.getShaderExpression('', {});
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for vector', function() {
        var expression = new Expression('vec4(1, 2, 3, 4)');
        var shaderExpression = expression.getShaderExpression('', {});
        expect(shaderExpression).toEqual('vec4(1.0, 2.0, 3.0, 4.0)');

        expression = new Expression('vec4(1) + vec4(2)');
        shaderExpression = expression.getShaderExpression('', {});
        expect(shaderExpression).toEqual('(vec4(1.0) + vec4(2.0))');

        expression = new Expression('vec4(1, ${property}, vec2(1, 2).x, 0)');
        shaderExpression = expression.getShaderExpression('', {});
        expect(shaderExpression).toEqual('vec4(1.0, property, vec2(1.0, 2.0)[0], 0.0)');

        expression = new Expression('vec4(vec3(2), 1.0)');
        shaderExpression = expression.getShaderExpression('', {});
        expect(shaderExpression).toEqual('vec4(vec3(2.0), 1.0)');
    });

    it('gets shader expression for vector components', function() {
        // .x, .y, .z, .w
        var expression = new Expression('vec4(1).x + vec4(1).y + vec4(1).z + vec4(1).w');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = '(((vec4(1.0)[0] + vec4(1.0)[1]) + vec4(1.0)[2]) + vec4(1.0)[3])';
        expect(shaderExpression).toEqual(expected);

        // [0], [1], [2], [3]
        expression = new Expression('vec4(1)[0] + vec4(1)[1] + vec4(1)[2] + vec4(1)[3]');
        shaderExpression = expression.getShaderExpression('', {});
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for TILES3D_TILESET_TIME', function() {
        var expression = new Expression('TILES3D_TILESET_TIME');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'u_tilesetTime';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for abs', function() {
        var expression = new Expression('abs(-1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'abs(-1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for cos', function() {
        var expression = new Expression('cos(0.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'cos(0.0)';
        expect(shaderExpression).toEqual(expected);
    });

     it('gets shader expression for sin', function() {
        var expression = new Expression('sin(0.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'sin(0.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for tan', function() {
        var expression = new Expression('tan(0.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'tan(0.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for acos', function() {
        var expression = new Expression('acos(0.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'acos(0.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for asin', function() {
        var expression = new Expression('asin(0.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'asin(0.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for atan', function() {
        var expression = new Expression('atan(0.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'atan(0.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for sqrt', function() {
        var expression = new Expression('sqrt(1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'sqrt(1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for sign', function() {
        var expression = new Expression('sign(1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'sign(1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for floor', function() {
        var expression = new Expression('floor(1.5)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'floor(1.5)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for ceil', function() {
        var expression = new Expression('ceil(1.2)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'ceil(1.2)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for round', function() {
        var expression = new Expression('round(1.2)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'floor(1.2 + 0.5)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for exp', function() {
        var expression = new Expression('exp(1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'exp(1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for exp2', function() {
        var expression = new Expression('exp2(1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'exp2(1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for log', function() {
        var expression = new Expression('log(1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'log(1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for log2', function() {
        var expression = new Expression('log2(1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'log2(1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for fract', function() {
        var expression = new Expression('fract(1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'fract(1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for clamp', function() {
        var expression = new Expression('clamp(50.0, 0.0, 100.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'clamp(50.0, 0.0, 100.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for mix', function() {
        var expression = new Expression('mix(0.0, 2.0, 0.5)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'mix(0.0, 2.0, 0.5)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for atan2', function() {
        var expression = new Expression('atan2(0.0,1.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'atan(0.0, 1.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for pow', function() {
        var expression = new Expression('pow(2.0,2.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'pow(2.0, 2.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for min', function() {
        var expression = new Expression('min(3.0,5.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'min(3.0, 5.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('gets shader expression for max', function() {
        var expression = new Expression('max(3.0,5.0)');
        var shaderExpression = expression.getShaderExpression('', {});
        var expected = 'max(3.0, 5.0)';
        expect(shaderExpression).toEqual(expected);
    });

    it('throws when getting shader expression for regex', function() {
        var expression = new Expression('regExp("a").test("abc")');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();

        expression = new Expression('regExp("a(.)", "i").exec("Abc")');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();

        expression = new Expression('regExp("a") =~ "abc"');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();

        expression = new Expression('regExp("a") !~ "abc"');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for member expression with dot', function() {
        var expression = new Expression('${property.name}');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for string member expression with brackets', function() {
        var expression = new Expression('${property["name"]}');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for String', function() {
        var expression = new Expression('String(1.0)');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for toString', function() {
        var expression = new Expression('color("red").toString()');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for literal string', function() {
        var expression = new Expression('"name"');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for variable in string', function() {
        var expression = new Expression('"${property}"');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for literal undefined', function() {
        var expression = new Expression('undefined');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for literal null', function() {
        var expression = new Expression('null');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for isNaN', function() {
        var expression = new Expression('isNaN(1.0)');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for isFinite', function() {
        var expression = new Expression('isFinite(1.0)');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for isExactClass', function() {
        var expression = new Expression('isExactClass("door")');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for isClass', function() {
        var expression = new Expression('isClass("door")');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });

    it('throws when getting shader expression for getExactClassName', function() {
        var expression = new Expression('getExactClassName()');
        expect(function() {
            return expression.getShaderExpression('', {});
        }).toThrowDeveloperError();
    });
});
