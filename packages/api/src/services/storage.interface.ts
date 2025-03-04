/**
 * Interface for storage services that interact with object storage systems
 * like S3, MinIO, etc.
 */
export interface StorageService {
  /**
   * Initialize the storage service and ensure the bucket exists
   */
  initialize(): Promise<void>;

  /**
   * Get an object from storage
   * @param objectName The name/path of the object to get
   * @returns The object data as a Buffer
   */
  getObject(objectName: string): Promise<Buffer>;

  /**
   * Put an object into storage
   * @param objectName The name/path to store the object as
   * @param data The data to store
   * @param contentType The content type of the data
   * @returns The name of the stored object
   */
  putObject(
    objectName: string,
    data: Buffer,
    contentType: string
  ): Promise<string>;

  /**
   * Check if an object exists in storage
   * @param objectName The name/path of the object to check
   * @returns True if the object exists, false otherwise
   */
  objectExists(objectName: string): Promise<boolean>;

  /**
   * Get a URL for an object in storage
   * @param objectName The name/path of the object
   * @param baseUrl Optional base URL to use for generating the URL
   * @returns The URL to access the object
   */
  getObjectUrl(objectName: string, baseUrl?: string): string;

  /**
   * List objects in storage with an optional prefix
   * @param prefix Optional prefix to filter objects by
   * @param recursive Whether to list objects recursively in subdirectories
   * @returns Array of object names/paths
   */
  listObjects(prefix?: string, recursive?: boolean): Promise<string[]>;

  /**
   * Remove an object from storage
   * @param objectName The name/path of the object to remove
   */
  removeObject(objectName: string): Promise<void>;

  /**
   * Remove multiple objects from storage
   * @param objectNames Array of object names/paths to remove
   */
  removeObjects(objectNames: string[]): Promise<void>;
}
