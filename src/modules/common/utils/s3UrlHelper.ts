export class S3UrlHelper {

    public static isS3Url(url: string): boolean {
        if (!url) return false;
        return url.includes('.s3.') && url.includes('.amazonaws.com');
    }
    public static extractS3Key(url: string): string {
        if (!this.isS3Url(url)) {
            throw new Error('Invalid S3 URL');
        }

        try {
            const urlObj = new URL(url);
            return urlObj.pathname.substring(1);
        } catch (error) {
            throw new Error('Failed to parse S3 URL');
        }
    }

    public static isValidAccessType(accessType: string): accessType is 'private' | 'public' {
        return accessType === 'private' || accessType === 'public';
    }

    public static getAccessTypeFromAcl(acl: string): 'private' | 'public' {
        if (acl === 'public-read' || acl === 'public-read-write') {
            return 'public';
        }
        return 'private';
    }

    public static getAclFromAccessType(accessType: 'private' | 'public'): string {
        return accessType === 'public' ? 'public-read' : 'private';
    }
}
