import typescript from 'rollup-plugin-typescript';
// import resolve from 'rollup-plugin-node-resolve';
// import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
import minify from 'rollup-plugin-babel-minify';
import buble from 'rollup-plugin-buble';
import pkg from './package.json';

function beforeExt(name, add) {
	var i = name.lastIndexOf('.');
	return i === -1
		? name+add
		: name.substr(0, i).concat(add, name.substr(i));
}

export default function getFormats(opt) {

const noMinify = opt && opt.noMinify;

function format(opt, plugin) {
	if (!(opt.plugins instanceof Array)) opt.plugins = [];
	opt.plugins.splice(0, 0, typescript(), buble());
	list.push(opt);
	if (!noMinify) {
		var min = Object.assign({}, opt);
		min.output = Object.assign({}, min.output);
		min.output.file = beforeExt(min.output.file, '.min');
		min.plugins = (min.plugins || []).concat([plugin || uglify()]);
		list.push(min);
	}
}

var list = [];

format({
	input: pkg.main,
	output: {
		name: pkg.export_var,
		file: pkg.browser,
		format: 'iife',
		indent: ''
	}
});
format({
	input: pkg.main,
	output: {
		name: pkg.export_var,
		file: pkg.main_dist,
		format: 'cjs',
		indent: ''
	}
});
format({
	input: pkg.main,
	output: {
		name: pkg.export_var,
		file: pkg.module,
		format: 'esm',
		indent: ''
	}
}, minify({
	comments: false,
	sourceMap: false
}));
format({
	input: pkg.main,
	output: {
		amd: {id: pkg.export_amd},
		name: pkg.export_var,
		file: pkg.module_amd,
		format: 'amd',
		indent: ''
	}
});

return list;

}
