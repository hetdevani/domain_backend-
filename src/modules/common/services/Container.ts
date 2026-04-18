class Container {
    services: Map<string, any>;

    constructor() {
        this.services = new Map();
    }

    get(serviceName: string) {
        return this.services.get(serviceName);
    }

    set(serviceName: string, instance: any) {
        this.services.set(serviceName, instance);
    }
}

export default new Container();
