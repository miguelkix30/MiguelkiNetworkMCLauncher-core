const child = require('child_process')
const path = require('path')
const Handler = require('./handler')
const fs = require('fs')
const EventEmitter = require('events').EventEmitter

class MCLCore extends EventEmitter {
  async launch (options) {
    try {
      this.emit('debug', '[MCLC]: Iniciando proceso de lanzamiento de Minecraft')
      this.emit('progress', {
        type: 'launch',
        task: 'initialization',
        current: 0,
        total: 10,
        message: 'Inicializando launcher'
      })

      this.options = { ...options }
      this.options.root = path.resolve(this.options.root)
      this.options.overrides = {
        detached: true,
        ...this.options.overrides,
        url: {
          meta: 'https://launchermeta.mojang.com',
          resource: 'https://resources.download.minecraft.net',
          mavenForge: 'https://files.minecraftforge.net/maven/',
          defaultRepoForge: 'https://libraries.minecraft.net/',
          fallbackMaven: 'https://search.maven.org/remotecontent?filepath=',
          ...this.options.overrides
            ? this.options.overrides.url
            : undefined
        },
        fw: {
          baseUrl: 'https://github.com/ZekerZhayard/ForgeWrapper/releases/download/',
          version: '1.6.0',
          sh1: '035a51fe6439792a61507630d89382f621da0f1f',
          size: 28679,
          ...this.options.overrides
            ? this.options.overrides.fw
            : undefined
        }
      }

      this.handler = new Handler(this)

      this.printVersion()

      this.emit('progress', {
        type: 'launch',
        task: 'java-check',
        current: 1,
        total: 10,
        message: 'Verificando instalación de Java'
      })

      const java = await this.handler.checkJava(this.options.javaPath || 'java')
      if (!java.run) {
        this.emit('debug', `[MCLC]: No se pudo iniciar Minecraft debido a: ${java.message}`)
        this.emit('error', {
          type: 'java-error',
          error: java.message,
          message: 'Java no está disponible o no se puede ejecutar'
        })
        this.emit('close', 1)
        return null
      }

      this.emit('debug', '[MCLC]: Java verificado correctamente')
      this.emit('progress', {
        type: 'launch',
        task: 'directory-setup',
        current: 2,
        total: 10,
        message: 'Configurando directorios'
      })

      this.createRootDirectory()
      this.createGameDirectory()

      this.emit('progress', {
        type: 'launch',
        task: 'package-extraction',
        current: 3,
        total: 10,
        message: 'Extrayendo paquetes del cliente'
      })

      await this.extractPackage()

      this.emit('progress', {
        type: 'launch',
        task: 'version-setup',
        current: 4,
        total: 10,
        message: 'Configurando archivos de versión'
      })

      const directory = this.options.overrides.directory || path.join(this.options.root, 'versions', this.options.version.custom ? this.options.version.custom : this.options.version.number)
      this.options.directory = directory

      const versionFile = await this.handler.getVersion()
      const mcPath = this.options.overrides.minecraftJar || (this.options.version.custom
        ? path.join(this.options.root, 'versions', this.options.version.custom, `${this.options.version.custom}.jar`)
        : path.join(directory, `${this.options.version.number}.jar`))
      this.options.mcPath = mcPath
      const nativePath = await this.handler.getNatives()

      if (!fs.existsSync(mcPath)) {
        this.emit('debug', '[MCLC]: Intentando descargar el JAR de la versión de Minecraft')
        this.emit('progress', {
          type: 'launch',
          task: 'jar-download',
          current: 5,
          total: 10,
          message: 'Descargando JAR de Minecraft'
        })
        await this.handler.getJar()
      }

      this.emit('progress', {
        type: 'launch',
        task: 'mod-processing',
        current: 6,
        total: 10,
        message: 'Procesando modificaciones (Forge/Custom)'
      })

      const modifyJson = await this.getModifyJson()

      this.emit('progress', {
        type: 'launch',
        task: 'jvm-setup',
        current: 7,
        total: 10,
        message: 'Configurando argumentos de JVM'
      })

      const args = []

      let jvm = [
        '-XX:-UseAdaptiveSizePolicy',
        '-XX:-OmitStackTraceInFastThrow',
        '-Dfml.ignorePatchDiscrepancies=true',
        '-Dfml.ignoreInvalidMinecraftCertificates=true',
        `-Djava.library.path=${nativePath}`,
        `-Xmx${this.handler.getMemory()[0]}`,
        `-Xms${this.handler.getMemory()[1]}`
      ]
      if (this.handler.getOS() === 'osx') {
        if (parseInt(versionFile.id.split('.')[1]) > 12) jvm.push(await this.handler.getJVM())
      } else jvm.push(await this.handler.getJVM())

      if (this.options.customArgs) jvm = jvm.concat(this.options.customArgs)
      if (this.options.overrides.logj4ConfigurationFile) {
        jvm.push(`-Dlog4j.configurationFile=${path.resolve(this.options.overrides.logj4ConfigurationFile)}`)
      }
      // https://help.minecraft.net/hc/en-us/articles/4416199399693-Security-Vulnerability-in-Minecraft-Java-Edition
      if (parseInt(versionFile.id.split('.')[1]) === 18 && !parseInt(versionFile.id.split('.')[2])) jvm.push('-Dlog4j2.formatMsgNoLookups=true')
      if (parseInt(versionFile.id.split('.')[1]) === 17) jvm.push('-Dlog4j2.formatMsgNoLookups=true')
      if (parseInt(versionFile.id.split('.')[1]) < 17) {
        if (!jvm.find(arg => arg.includes('Dlog4j.configurationFile'))) {
          const configPath = path.resolve(this.options.overrides.cwd || this.options.root)
          const intVersion = parseInt(versionFile.id.split('.')[1])
          if (intVersion >= 12) {
            const phaseProgress = {
              current: 0,
              total: 1,
              message: 'Descargando configuración log4j'
            }
            await this.handler.downloadAsync('https://launcher.mojang.com/v1/objects/02937d122c86ce73319ef9975b58896fc1b491d1/log4j2_112-116.xml',
              configPath, 'log4j2_112-116.xml', true, 'log4j', phaseProgress)
            jvm.push('-Dlog4j.configurationFile=log4j2_112-116.xml')
          } else if (intVersion >= 7) {
            const phaseProgress = {
              current: 0,
              total: 1,
              message: 'Descargando configuración log4j'
            }
            await this.handler.downloadAsync('https://launcher.mojang.com/v1/objects/dd2b723346a8dcd48e7f4d245f6bf09e98db9696/log4j2_17-111.xml',
              configPath, 'log4j2_17-111.xml', true, 'log4j', phaseProgress)
            jvm.push('-Dlog4j.configurationFile=log4j2_17-111.xml')
          }
        }
      }

      const classes = this.options.overrides.classes || this.handler.cleanUp(await this.handler.getClasses(modifyJson))
      const classPaths = ['-cp']
      const separator = this.handler.getOS() === 'windows' ? ';' : ':'
      this.emit('debug', `[MCLC]: Using ${separator} to separate class paths`)
      // Handling launch arguments.
      const file = modifyJson || versionFile
      // So mods like fabric work.
      const jar = fs.existsSync(mcPath)
        ? `${separator}${mcPath}`
        : `${separator}${path.join(directory, `${this.options.version.number}.jar`)}`
      classPaths.push(`${this.options.forge ? this.options.forge + separator : ''}${classes.join(separator)}${jar}`)
      classPaths.push(file.mainClass)

      this.emit('debug', '[MCLC]: Intentando descargar assets')
      this.emit('progress', {
        type: 'launch',
        task: 'assets-download',
        current: 8,
        total: 10,
        message: 'Descargando recursos del juego'
      })
      await this.handler.getAssets()

      // Forge -> Custom -> Vanilla
      this.emit('progress', {
        type: 'launch',
        task: 'launch-options',
        current: 9,
        total: 10,
        message: 'Configurando opciones de lanzamiento'
      })
      const launchOptions = await this.handler.getLaunchOptions(modifyJson)

      this.emit('progress', {
        type: 'launch',
        task: 'final-preparation',
        current: 10,
        total: 10,
        message: 'Preparando lanzamiento final'
      })

      const launchArguments = args.concat(jvm, classPaths, launchOptions)
      this.emit('arguments', launchArguments)
      this.emit('debug', `[MCLC]: Lanzando con argumentos: ${launchArguments.join(' ')}`)

      this.emit('progress', {
        type: 'launch',
        task: 'starting-minecraft',
        current: 10,
        total: 10,
        message: 'Iniciando Minecraft...'
      })

      return this.startMinecraft(launchArguments)
    } catch (e) {
      this.emit('debug', `[MCLC]: Error al iniciar: ${e.message || e}`)
      this.emit('error', {
        type: 'launch-error',
        error: e.message || e,
        stack: e.stack,
        message: 'Error durante el proceso de lanzamiento'
      })
      this.emit('close', 1)
      return null
    }
  }

  printVersion () {
    if (fs.existsSync(path.join(__dirname, '..', 'package.json'))) {
      const { version } = require('../package.json')
      this.emit('debug', `[MCLC]: MCLC version ${version}`)
    } else { this.emit('debug', '[MCLC]: Package JSON not found, skipping MCLC version check.') }
  }

  createRootDirectory () {
    if (!fs.existsSync(this.options.root)) {
      this.emit('debug', '[MCLC]: Attempting to create root folder')
      fs.mkdirSync(this.options.root)
    }
  }

  createGameDirectory () {
    if (this.options.overrides.gameDirectory) {
      this.options.overrides.gameDirectory = path.resolve(this.options.overrides.gameDirectory)
      if (!fs.existsSync(this.options.overrides.gameDirectory)) {
        fs.mkdirSync(this.options.overrides.gameDirectory, { recursive: true })
      }
    }
  }

  async extractPackage () {
    if (this.options.clientPackage) {
      this.emit('debug', `[MCLC]: Extracting client package to ${this.options.root}`)
      await this.handler.extractPackage()
    }
  }

  async getModifyJson () {
    let modifyJson = null

    if (this.options.forge) {
      this.options.forge = path.resolve(this.options.forge)
      this.emit('debug', '[MCLC]: Detected Forge in options, getting dependencies')
      modifyJson = await this.handler.getForgedWrapped()
    } else if (this.options.version.custom) {
      this.emit('debug', '[MCLC]: Detected custom in options, setting custom version file')
      modifyJson = modifyJson || JSON.parse(fs.readFileSync(path.join(this.options.root, 'versions', this.options.version.custom, `${this.options.version.custom}.json`), { encoding: 'utf8' }))
    }

    return modifyJson
  }

  startMinecraft (launchArguments) {
    this.emit('debug', '[MCLC]: Iniciando proceso de Minecraft')
    try {
      const minecraft = child.spawn(this.options.javaPath ? this.options.javaPath : 'java', launchArguments,
        { cwd: this.options.overrides.cwd || this.options.root, detached: this.options.overrides.detached })
      
      this.emit('minecraft-started', {
        pid: minecraft.pid,
        arguments: launchArguments,
        cwd: this.options.overrides.cwd || this.options.root
      })
      
      minecraft.stdout.on('data', (data) => {
        const output = data.toString('utf-8')
        this.emit('data', output)
        this.emit('minecraft-log', {
          type: 'stdout',
          message: output.trim()
        })
      })
      
      minecraft.stderr.on('data', (data) => {
        const output = data.toString('utf-8')
        this.emit('data', output)
        this.emit('minecraft-log', {
          type: 'stderr',
          message: output.trim()
        })
      })
      
      minecraft.on('close', (code) => {
        this.emit('debug', `[MCLC]: Minecraft se ha cerrado con código: ${code}`)
        this.emit('minecraft-closed', {
          code: code,
          signal: null
        })
        this.emit('close', code)
      })
      
      minecraft.on('error', (error) => {
        this.emit('debug', `[MCLC]: Error en el proceso de Minecraft: ${error.message}`)
        this.emit('error', {
          type: 'minecraft-process-error',
          error: error.message,
          message: 'Error en el proceso de Minecraft'
        })
      })
      
      return minecraft
    } catch (e) {
      this.emit('debug', `[MCLC]: Error al crear el proceso de Minecraft: ${e.message}`)
      this.emit('error', {
        type: 'spawn-error',
        error: e.message,
        message: 'Error al crear el proceso de Minecraft'
      })
      return null
    }
  }
}

module.exports = MCLCore
