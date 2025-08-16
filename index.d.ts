/// <reference types="node" />

declare module "minecraft-launcher-core" {
  type OS = "windows" | "osx" | "linux";

  interface IOverrides {
    /**
     * The amount of launch arguments specified in the version file before it adds the default again
     */
    minArgs?: number;
    minecraftJar?: string;
    versionJson?: string;
    versionName?: string;
    /**
     * Folder, where the game process generates folders like saves and resource packs.
     */
    gameDirectory?: string;
    /**
     * Folder, where the Minecraft jar and version json are located.
     */
    directory?: string;
    natives?: string;
    assetRoot?: string;
    assetIndex?: string;
    libraryRoot?: string;
    /**
     * Working directory of the java process.
     */
    cwd?: string;
    /**
     * Whether or not the client is detached from the parent / launcher.
     */
    detached?: boolean;
    /**
     * List of classes.
     * All class paths are required if you use this.
     */
    classes?: Array<string>;
    /**
     * Max sockets for downloadAsync.
     */
    maxSockets?: number;
    /**
     * Urls to the Minecraft and Forge resource servers
     * 
     * This is for launcher developers located in countries that have the Minecraft and Forge resource servers
     * blocked for what ever reason. They obviously need to mirror the formatting of the original JSONs / file structures.
     */
    url?: {
      /**
       * List of versions.
       */
      meta?: string;
      /**
       * Minecraft resources.
       */
      resource?: string;
      /**
       * Forge resources.
       */
      mavenForge?: string;
      /**
       * for Forge only, you need to redefine the library url in the version json.
       */
      defaultRepoForge?: string;
      /**
       * 
       */
      fallbackMaven?: string;
    };
    /**
     * Version of the ForgeWrapper which MCLC uses. This allows us to launch modern Forge.
     */
    fw?: {
      baseUrl?: string;
      version?: string;
      sh1?: string;
      size?: number;
    };
    logj4ConfigurationFile?: string;
  }

  interface ILauncherOptions {
    /**
     * Path or URL to the client package zip file.
     */
    clientPackage?: string;
    /**
     * if true MCLC will remove the client package zip file after its finished extracting.
     */
    removePackage?: boolean;
    /**
     * Path where you want the launcher to work in.
     * This will usually be your .minecraft folder
     */
    root: string;
    /**
     * OS override for minecraft natives
     * 
     * @default will autodetect
     */
    os?: OS;
    /**
     * Array of custom Minecraft arguments. 
     */
    customLaunchArgs?: Array<string>;
    /**
     * Array of custom Java arguments
     */
    customArgs?: Array<string>;
    /**
     * Array of game argument feature flags
     */
    features?: Array<string>;
    /**
     * minecraft version info
     */
    version: {
      /**
       * Actual version. 
       * 
       * @example '1.16.4'
       */
      number: string;
      /**
       * type of release, usually `release` or `snapshot`
       */
      type: 'release' | 'snapshot' | string;
      /**
       * 	The name of the folder, jar file, and version json in the version folder. 
       * 
       * ` MCLC will look in the `versions` folder for this name
       * @example '1.16.4-fabric'
       */
      custom?: string;
    };
    memory: {
      /**
       * Min amount of memory being used by Minecraft.
       */
      max: string | number;
      /**
       * Max amount of memory being used by Minecraft.
       */
      min: string | number;
    };
    /**
     * Path to Forge Jar. 
     * 
     * Versions below 1.13 should be the "universal" jar while versions above 1.13+ should be the "installer" jar
     */
    forge?: string;
    /**
     * Path to the JRE executable file, will default to java if not entered.
     */
    javaPath?: string;
    proxy?: {
      /**
       * Host url to the proxy, don't include the port.
       */
      host: string;
      /**
       *  Username for the proxy.
       * 
       * @default 8080
       */
      port?: string;
      /**
       * Username for the proxy.
       */
      username?: string;
      /**
       * Password for the proxy.
       */
      password?: string;
    };
    /**
     * Timeout on download requests.
     */
    timeout?: number;
    window?: {

      /**
       * Width of the Minecraft Client
       */
      width?: number;
      /**
       * Height of the Minecraft Client
       */
      height?: number;
      /**
       * Fullscreen the Minecraft Client.
       */
      fullscreen?: boolean;
    };


    /**
     * Allows the game to be launched directly into a world
     */
    quickPlay?: {
      /**
       * The type of world you want to join.
       * Note, that versions prior to 1.20 only support "legacy"
       */
      type: 'singleplayer' | 'multiplayer' | 'realms' | 'legacy';
      /**
       * Represents the world you want to join
       *
       * For singleplayer this should be the folder name of the world
       * For multiplayer this should be the IP address of the server
       * For realms this should be the Realms ID
       * legacy follows multiplayer format
       */
      identifier: string;
      /**
       * The specified path for logging (relative to the run directory)
       */
      path?: string;
    };
    /**
     * Json object redefining paths for better customization
     */
    overrides?: IOverrides;

    authorization: Promise<IUser> | IUser;
    /**
     * Path of json cache.
     */
    cache?: string;
  }

  interface IUser {
    access_token: string;
    client_token: string;
    uuid: string;
    name: string;
    user_properties: Partial<any>;
    meta?: {
      type: "mojang" | "msa",
      demo?: boolean
    };
  }

  interface IProfile {
    id: number;
    name: string;
  }

  interface IAuthenticator {
    /**
     * @param username email if using a password, else the username
     * @param password password for mojang account
     */
    getAuth(username: string, password?: string): Promise<IUser>;
    /**
     * 
     * @param access_token Token being checked if it can be used to login with (online mode)
     * @param client_token Client token being checked to see if there was a change of client (online mode)
     */
    validate(
      access_token: string,
      client_token: string
    ): Promise<boolean | Partial<any>>;
    /**
     * 
     * @param access_token Token being checked if it can be used to login with (online mode)
     * @param client_token Client token being checked to see if there was a change of client (online mode)
     */
    refreshAuth(
      access_token: string,
      client_token: string,
    ): Promise<IUser>;
    /**
     * 
     * @param access_token Token being checked if it can be used to login with (online mode)
     * @param client_token Client token being checked to see if there was a change of client (online mode)
     */
    invalidate(
      access_token: string,
      client_token: string
    ): Promise<boolean | Partial<any>>;
    /**
      * @param username email if using a password, else the username
      * @param password password for mojang account
      */
    signOut(
      username: string,
      password: string
    ): Promise<boolean | Partial<any>>;
    changeApiUrl(url: string): void;
  }

  // Event interfaces for better type support
  interface IProgressEvent {
    type: string;
    task: string;
    current: number;
    total: number;
    message: string;
  }

  interface IPhaseProgress {
    current: number;
    total: number;
    percentage: number;
    message: string;
  }

  interface IDownloadStatusEvent {
    name: string;
    type: string;
    current: number;
    total: number;
    percentage: number;
    phaseProgress: IPhaseProgress;
  }

  interface IDownloadStartEvent {
    url: string;
    file: string;
    type: string;
    totalBytes: number;
    phaseProgress: IPhaseProgress;
  }

  interface IDownloadCompleteEvent {
    file: string;
    type: string;
    url: string;
    phaseProgress: IPhaseProgress;
  }

  interface IDownloadErrorEvent {
    url: string;
    file: string;
    type: string;
    error: string;
    retry?: boolean;
    phaseProgress: IPhaseProgress;
  }

  interface IErrorEvent {
    type: string;
    error: string;
    message: string;
    stack?: string;
  }

  interface IMinecraftStartedEvent {
    pid: number;
    arguments: string[];
    cwd: string;
  }

  interface IMinecraftLogEvent {
    type: 'stdout' | 'stderr';
    message: string;
  }

  interface IMinecraftClosedEvent {
    code: number;
    signal: string | null;
  }

  import { EventEmitter } from 'events'
  import { ChildProcessWithoutNullStreams } from 'child_process'

  export class Client extends EventEmitter {
    launch(options: ILauncherOptions): Promise<ChildProcessWithoutNullStreams | null>;
    protected printVersion(): void;
    protected createRootDirectory(): void;
    protected createGameDirectory(): void;
    protected extractPackage(): Promise<void>;
    protected getModifyJson(): Promise<any>;
    protected startMinecraft(launchArguments: string[]): ChildProcessWithoutNullStreams | null;

    // Event overrides for better typing
    on(event: 'debug', listener: (message: string) => void): this;
    on(event: 'progress', listener: (progress: IProgressEvent) => void): this;
    on(event: 'download-status', listener: (status: IDownloadStatusEvent) => void): this;
    on(event: 'download-start', listener: (start: IDownloadStartEvent) => void): this;
    on(event: 'download-complete', listener: (complete: IDownloadCompleteEvent) => void): this;
    on(event: 'download-error', listener: (error: IDownloadErrorEvent) => void): this;
    on(event: 'download', listener: (filename: string) => void): this;
    on(event: 'error', listener: (error: IErrorEvent) => void): this;
    on(event: 'minecraft-started', listener: (info: IMinecraftStartedEvent) => void): this;
    on(event: 'minecraft-log', listener: (log: IMinecraftLogEvent) => void): this;
    on(event: 'minecraft-closed', listener: (info: IMinecraftClosedEvent) => void): this;
    on(event: 'data', listener: (data: string) => void): this;
    on(event: 'arguments', listener: (args: string[]) => void): this;
    on(event: 'close', listener: (code: number) => void): this;
    on(event: 'package-extract', listener: (success: boolean) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    emit(event: 'debug', message: string): boolean;
    emit(event: 'progress', progress: IProgressEvent): boolean;
    emit(event: 'download-status', status: IDownloadStatusEvent): boolean;
    emit(event: 'download-start', start: IDownloadStartEvent): boolean;
    emit(event: 'download-complete', complete: IDownloadCompleteEvent): boolean;
    emit(event: 'download-error', error: IDownloadErrorEvent): boolean;
    emit(event: 'download', filename: string): boolean;
    emit(event: 'error', error: IErrorEvent): boolean;
    emit(event: 'minecraft-started', info: IMinecraftStartedEvent): boolean;
    emit(event: 'minecraft-log', log: IMinecraftLogEvent): boolean;
    emit(event: 'minecraft-closed', info: IMinecraftClosedEvent): boolean;
    emit(event: 'data', data: string): boolean;
    emit(event: 'arguments', args: string[]): boolean;
    emit(event: 'close', code: number): boolean;
    emit(event: 'package-extract', success: boolean): boolean;
    emit(event: string, ...args: any[]): boolean;
  }

  export const Authenticator: IAuthenticator;
}
