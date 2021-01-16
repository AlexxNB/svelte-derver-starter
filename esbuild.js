const { fork } = require("child_process");
const { build } = require("esbuild");
const sveltePlugin = require("esbuild-svelte");
const watch = require("node-watch");
const path = require("path");
const builtins = require('builtins')

const DEV = process.argv.includes('--dev');
const CWD = process.cwd();

(async ()=>{
    await build_server();
    await build_client();

    if(DEV){
        nodemon(path.join(CWD,'dist','app.js'),{cwd:path.join(CWD,'dist')})
        
        watch(path.join(CWD,'src','client'),{ recursive: true }, function() {
            build_client();
        });

        watch(path.join(CWD,'src','server'),{ recursive: true }, async function() {
            await build_server();
            await build_client();
            console.log('Restarting server...');
        });
    }
})()

async function build_server(){
    await build({
        entryPoints: ['src/server/main.js'],
        bundle: true,
        outfile: 'dist/app.js',
        platform: 'node',
        sourcemap: DEV && 'inline',
        minify: !DEV,
        external:builtins(),
        plugins:[
            plugin_server()
        ]
    });
}

async function build_client(){
    await build({
        entryPoints: ['src/client/main.js'],
        bundle: true,
        outfile: 'dist/static/build/bundle.js',
        sourcemap: DEV && 'inline',
        minify: !DEV,
        plugins: [
            sveltePlugin({compileOptions:{
                dev: DEV,
                css: false
            }})
        ]
    });
}

function plugin_server(){return {
    name: 'server-plugin',
    setup(b) {
        b.onResolve({ filter: /^@server$/ }, args => {

            return { path: DEV ? 'server_development.js' : 'server_production.js', namespace: 'server' }
        });
        
        b.onLoad({ filter: /^server_development\.js$/, namespace: 'server'}, (args) => {
            return {
                contents: `
                    import {derver} from "derver";
                    import path from "path";
                    const DIR = path.join(__dirname,'static');
                    export default function (options){
                        return derver({
                            dir: path.join(__dirname,'static'),
                            ...options
                        });
                    }
                `,
                resolveDir: CWD
            }
        });

        b.onLoad({ filter: /^server_production\.js$/, namespace: 'server'}, (args) => {
            return {
                contents: `
                    import {derver} from "derver";
                    import path from "path";
                    const DIR = path.join(__dirname,'static');
                    export default function (options){
                        return derver({
                            dir: path.join(__dirname,'static'),
                            cache: true,
                            compress: true,
                            watch: false,
                            host: "0.0.0.0",
                            ...options
                        });
                    }
                `,
                resolveDir: CWD
            }
        });
    }
  }
}

function nodemon (path,options){
    let child;
    const kill = ()=>{
        child && child.kill()
    }

    const start = () => {
        child = fork(path, [], options);
    }

    process.on('SIGTERM', kill);
    process.on('exit', kill);

    start();
    watch(path,()=>{
        kill();
        start();
    });
};