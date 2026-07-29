export namespace main {

	export class ArtifactContentRequest {
	    bytesBase64: string;
	    mediaType: string;
	    name: string;

	    static createFrom(source: any = {}) {
	        return new ArtifactContentRequest(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bytesBase64 = source["bytesBase64"];
	        this.mediaType = source["mediaType"];
	        this.name = source["name"];
	    }
	}
	export class ArtifactRequest {
	    artifact: ArtifactContentRequest;
	    kind: string;
	    suggestedName: string;

	    static createFrom(source: any = {}) {
	        return new ArtifactRequest(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.artifact = this.convertValues(source["artifact"], ArtifactContentRequest);
	        this.kind = source["kind"];
	        this.suggestedName = source["suggestedName"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AssetRequest {
	    accept: string[];
	    maximumBytes: number;
	    multiple: boolean;

	    static createFrom(source: any = {}) {
	        return new AssetRequest(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accept = source["accept"];
	        this.maximumBytes = source["maximumBytes"];
	        this.multiple = source["multiple"];
	    }
	}
	export class NativeAsset {
	    bytesBase64: string;
	    mediaType: string;
	    name: string;

	    static createFrom(source: any = {}) {
	        return new NativeAsset(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bytesBase64 = source["bytesBase64"];
	        this.mediaType = source["mediaType"];
	        this.name = source["name"];
	    }
	}
	export class AssetsResponse {
	    assets?: NativeAsset[];
	    error?: native.ServiceError;

	    static createFrom(source: any = {}) {
	        return new AssetsResponse(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.assets = this.convertValues(source["assets"], NativeAsset);
	        this.error = this.convertValues(source["error"], native.ServiceError);
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class BytesResponse {
	    bytesBase64?: string;
	    error?: native.ServiceError;

	    static createFrom(source: any = {}) {
	        return new BytesResponse(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bytesBase64 = source["bytesBase64"];
	        this.error = this.convertValues(source["error"], native.ServiceError);
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CommitFileRequest {
	    bytesBase64: string;
	    path: string;

	    static createFrom(source: any = {}) {
	        return new CommitFileRequest(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bytesBase64 = source["bytesBase64"];
	        this.path = source["path"];
	    }
	}
	export class CommitFilesRequest {
	    expectedRevision: string;
	    files: CommitFileRequest[];
	    token: string;

	    static createFrom(source: any = {}) {
	        return new CommitFilesRequest(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.expectedRevision = source["expectedRevision"];
	        this.files = this.convertValues(source["files"], CommitFileRequest);
	        this.token = source["token"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EmptyResponse {
	    error?: native.ServiceError;

	    static createFrom(source: any = {}) {
	        return new EmptyResponse(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.error = this.convertValues(source["error"], native.ServiceError);
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FilesResponse {
	    error?: native.ServiceError;
	    files?: native.FileEntry[];

	    static createFrom(source: any = {}) {
	        return new FilesResponse(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.error = this.convertValues(source["error"], native.ServiceError);
	        this.files = this.convertValues(source["files"], native.FileEntry);
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

	export class ProjectResponse {
	    error?: native.ServiceError;
	    project?: native.ProjectReference;

	    static createFrom(source: any = {}) {
	        return new ProjectResponse(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.error = this.convertValues(source["error"], native.ServiceError);
	        this.project = this.convertValues(source["project"], native.ProjectReference);
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RevisionResponse {
	    error?: native.ServiceError;
	    revision?: string;

	    static createFrom(source: any = {}) {
	        return new RevisionResponse(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.error = this.convertValues(source["error"], native.ServiceError);
	        this.revision = source["revision"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ValueResponse {
	    error?: native.ServiceError;
	    found: boolean;
	    valueJSON?: string;

	    static createFrom(source: any = {}) {
	        return new ValueResponse(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.error = this.convertValues(source["error"], native.ServiceError);
	        this.found = source["found"];
	        this.valueJSON = source["valueJSON"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace native {

	export class FileEntry {
	    mediaType?: string;
	    modifiedAt?: string;
	    path: string;
	    size: number;

	    static createFrom(source: any = {}) {
	        return new FileEntry(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mediaType = source["mediaType"];
	        this.modifiedAt = source["modifiedAt"];
	        this.path = source["path"];
	        this.size = source["size"];
	    }
	}
	export class ProjectReference {
	    name: string;
	    revision?: string;
	    token: string;

	    static createFrom(source: any = {}) {
	        return new ProjectReference(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.revision = source["revision"];
	        this.token = source["token"];
	    }
	}
	export class ServiceError {
	    code: string;
	    details?: Record<string, any>;
	    message: string;
	    retryable: boolean;

	    static createFrom(source: any = {}) {
	        return new ServiceError(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.code = source["code"];
	        this.details = source["details"];
	        this.message = source["message"];
	        this.retryable = source["retryable"];
	    }
	}

}
