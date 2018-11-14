const fs = require('fs');
import {util} from '../service/index';
import baseBucket from './baseBucket';
import * as tencent from './tencent';

class Bucket extends baseBucket {

    constructor(name, cos) {
        super(name, cos);
    }

    reset() {
        super.reset();

        this.location = '';
    }

    /**
     * 根据privateBuckets判断是否是私有空间
     * 获取域名
     * 获取目录
     * 获取默认资源列表
     * @param vm => page
     */
    bindPage(vm) {
        this.vm = vm;

        this.vm.buckets_info.forEach((item) => {
            if (item.name === this.name) {
                this.location = item.location;
            }
        });

        if (this.location) {
            this.getResources();
        }
        /*this.checkPrivate();
        this.getDomains();
        */
    }

    createFile(_param, type, callback) {
        let param = {
            Bucket: this.name,
            Region: this.location,
            Key: _param.key,
            // Body: fs.readFileSync(_param.path),//onProgress 无响应
            Body: fs.createReadStream(_param.path),
            ContentLength: fs.statSync(_param.path).size,
            onProgress: function (progressData) {
                _param.progressCallback(progressData.percent * 100);
            }
        };

        this.cos.putObject(param, (err, data) => {
            callback(err, {key: _param.key});
        });
    }

    removeFile(item, callback) {
        let params = {
            Bucket: this.name,
            Region: this.location,
        };

        tencent.remove(params, item, callback);
    }

    renameFile(items, callback) {
        let params = {
            Bucket: this.name,
            Region: this.location,
        };

        tencent.rename(params, items, callback);
    }

    getResources(keyword) {
        let params = {
            limit: this.limit,
        };

        if (keyword) {
            params.Prefix = keyword;
        }

        if (this.marker) {
            params.marker = this.marker;
        }

        this.cos.Bucket(this.name, this.location).listObjects(function (err, data) {
            console.log(data.statusCode);
            console.log(data);

            data.marker = data.next_marker;

            if (!this.marker) {
                this.files = [];
            }
            let files = [];
            data.keys.forEach((item) => {
                if (parseInt(item.Size) !== 0) {
                    files.push(util.convertMeta(item, 2));
                }
            });

            data.items = files;
            this.appendResources(data, keyword);
        });
    }

    /**
     * 返回资源真实链接
     * @param index
     * @param key
     * @param deadline  私有模式,文件有效期
     * @returns {*}
     */
    generateUrl(key, deadline) {
        let params = {
            Bucket: this.name,
            Region: this.location,
            Key: key
        };

        return this.cos.getObjectUrl(params, (err, data) => {
            //console.log(err || data);
        });
    }
}


export default Bucket;