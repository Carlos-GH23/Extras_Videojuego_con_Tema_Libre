"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Pause, Play, Map, Puzzle } from "lucide-react"

interface MiniGame {
  type: "memory" | "circuit" | "laser" | "binary" | "hacking"
  active: boolean
  timeLeft: number
  maxTime: number
  data: any
  completed: boolean
  x: number
  y: number
}

interface GameState {
  player: {
    x: number
    y: number
    width: number
    height: number
    velocityX: number
    velocityY: number
    energy: number
    checkpoints: number
  }
  maze: number[][]
  level: number
  timeLeft: number
  score: number
  gameState: "menu" | "playing" | "paused" | "minigame" | "gameOver" | "levelComplete" | "gameComplete"
  keys: { [key: string]: boolean }
  currentMiniGame: MiniGame | null
  miniGames: MiniGame[]
  mazeWidth: number
  mazeHeight: number
  cellSize: number
  goalX: number
  goalY: number
  movingWalls: Array<{
    x: number
    y: number
    direction: number
    speed: number
    timer: number
  }>
  glitchZones: Array<{
    x: number
    y: number
    width: number
    height: number
    active: boolean
    timer: number
  }>
}

const LEVELS = [
  { name: "Circuito Básico", timeLimit: 120, color: "#10b981", complexity: 1 }, // era 180
  { name: "Núcleo Dinámico", timeLimit: 150, color: "#f59e0b", complexity: 2 }, // era 240
  { name: "Laberinto Caótico", timeLimit: 180, color: "#ef4444", complexity: 3 }, // era 300
]

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 35, // 1 * 30 + 5
      y: 35, // 1 * 30 + 5
      width: 20,
      height: 20,
      velocityX: 0,
      velocityY: 0,
      energy: 100,
      checkpoints: 0,
    },
    maze: [],
    level: 1,
    timeLeft: 120,
    score: 0,
    gameState: "menu",
    keys: {},
    currentMiniGame: null,
    miniGames: [],
    mazeWidth: 25,
    mazeHeight: 19,
    cellSize: 30,
    goalX: 23,
    goalY: 17,
    movingWalls: [],
    glitchZones: [],
  })

  // Audio context for background music
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Generate maze using recursive backtracking
  const generateMaze = useCallback((width: number, height: number, complexity: number) => {
    const maze = Array(height)
      .fill(null)
      .map(() => Array(width).fill(1))

    // Simple maze generation for demo
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        maze[y][x] = 0 // Path

        // Create random connections
        if (Math.random() < 0.7) {
          if (x + 2 < width - 1) maze[y][x + 1] = 0
        }
        if (Math.random() < 0.7) {
          if (y + 2 < height - 1) maze[y + 1][x] = 0
        }
      }
    }

    // Add complexity based on level
    if (complexity >= 2) {
      // Add some loops
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * (width - 2)) + 1
        const y = Math.floor(Math.random() * (height - 2)) + 1
        if (maze[y][x] === 1) maze[y][x] = 0
      }
    }

    if (complexity >= 3) {
      // Add more complex paths
      for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * (width - 2)) + 1
        const y = Math.floor(Math.random() * (height - 2)) + 1
        if (maze[y][x] === 1) maze[y][x] = 0
      }
    }

    // Ensure start and end are clear
    maze[1][1] = 0
    maze[height - 2][width - 2] = 0

    return maze
  }, [])

  // Generate minigames
  const generateMiniGames = useCallback(
    (level: number, maze: number[][]) => {
      const miniGames: MiniGame[] = []
      const count = 2 + level

      // Encontrar todas las celdas accesibles
      const accessibleCells: { x: number; y: number }[] = []
      for (let y = 1; y < gameState.mazeHeight - 1; y++) {
        for (let x = 1; x < gameState.mazeWidth - 1; x++) {
          if (maze[y] && maze[y][x] === 0) {
            // Evitar la posición inicial del jugador y la meta
            if (!(x === 1 && y === 1) && !(x === gameState.goalX && y === gameState.goalY)) {
              accessibleCells.push({ x, y })
            }
          }
        }
      }

      for (let i = 0; i < count && i < accessibleCells.length; i++) {
        const randomIndex = Math.floor(Math.random() * accessibleCells.length)
        const cell = accessibleCells[randomIndex]
        accessibleCells.splice(randomIndex, 1) // Remover para evitar duplicados

        const types: MiniGame["type"][] = ["memory", "circuit", "laser", "binary", "hacking"]
        const type = types[Math.floor(Math.random() * types.length)]

        miniGames.push({
          type,
          active: false,
          timeLeft: type === "memory" ? 20 : type === "circuit" ? 30 : type === "laser" ? 40 : 60, // reducidos
          maxTime: type === "memory" ? 20 : type === "circuit" ? 30 : type === "laser" ? 40 : 60, // reducidos
          data: generateMiniGameData(type),
          completed: false,
          x: cell.x,
          y: cell.y,
        })
      }

      return miniGames
    },
    [gameState.mazeWidth, gameState.mazeHeight, gameState.goalX, gameState.goalY],
  )

  const generateMiniGameData = (type: MiniGame["type"]) => {
    switch (type) {
      case "memory":
        return {
          sequence: Array.from({ length: 4 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 4)),
          playerSequence: [],
          showingSequence: true,
          currentIndex: 0,
          timer: 0,
        }
      case "circuit":
        return {
          playerConnections: [],
        }
      case "laser":
        return {
          playerX: 50,
          playerY: 150,
          speed: 3,
          hasShield: false,
          shieldTime: 0,
          hasBoost: false,
          boostTime: 0,
          lasers: Array.from({ length: 5 }, () => ({
            x: 100 + Math.random() * 400,
            y: 150 + Math.random() * 200,
            width: 60 + Math.random() * 80,
            height: 8,
            direction: Math.random() * Math.PI * 2,
            speed: 1.5 + Math.random() * 2,
          })),
          powerUps: Array.from({ length: 3 }, () => ({
            x: 100 + Math.random() * 500,
            y: 150 + Math.random() * 200,
            type: Math.random() > 0.5 ? "shield" : "boost",
            collected: false,
          })),
          goalReached: false,
        }
      case "binary":
        const target = Math.floor(Math.random() * 128) + 1 // 1-128 para que sea más fácil
        return {
          target,
          playerBinary: "00000000",
          currentBit: 0,
        }
      case "hacking":
        return {
          codes: Array.from({ length: 6 }, () => ({
            code: Math.floor(Math.random() * 9000) + 1000, // 4 digit codes
            cracked: false,
          })),
          currentCode: "",
          attempts: 3,
        }
      default:
        return {}
    }
  }

  const initializeLevel = useCallback(
    (level: number) => {
      const complexity = LEVELS[level - 1].complexity
      const maze = generateMaze(gameState.mazeWidth, gameState.mazeHeight, complexity)

      const movingWalls = []
      const glitchZones = []

      // Add moving walls for level 2+
      if (level >= 2) {
        for (let i = 0; i < 3; i++) {
          movingWalls.push({
            x: Math.floor(Math.random() * gameState.mazeWidth),
            y: Math.floor(Math.random() * gameState.mazeHeight),
            direction: Math.floor(Math.random() * 4),
            speed: 60 + Math.random() * 60,
            timer: 0,
          })
        }
      }

      // Add glitch zones for level 3
      if (level >= 3) {
        for (let i = 0; i < 2; i++) {
          glitchZones.push({
            x: Math.floor(Math.random() * (gameState.mazeWidth - 4)) + 2,
            y: Math.floor(Math.random() * (gameState.mazeHeight - 4)) + 2,
            width: 3,
            height: 3,
            active: false,
            timer: 0,
          })
        }
      }

      setGameState((prev) => ({
        ...prev,
        maze,
        level,
        timeLeft: LEVELS[level - 1].timeLimit,
        player: {
          ...prev.player,
          x: 1 * gameState.cellSize + 5, // Posición en píxeles dentro de la celda
          y: 1 * gameState.cellSize + 5, // Posición en píxeles dentro de la celda
          energy: 100,
          checkpoints: 0,
        },
        movingWalls,
        glitchZones,
        miniGames: [],
      }))

      // Generate minigames after maze is set
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          miniGames: generateMiniGames(level, maze),
        }))
      }, 100)
    },
    [generateMaze, generateMiniGames, gameState.mazeWidth, gameState.mazeHeight],
  )

  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      gameState: "playing",
      score: 0,
      level: 1,
    }))
    initializeLevel(1)
  }, [initializeLevel])

  const resetGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      gameState: "menu",
      score: 0,
      level: 1,
      currentMiniGame: null,
      player: {
        x: 1 * 30 + 5, // 1 * cellSize + offset
        y: 1 * 30 + 5, // 1 * cellSize + offset
        width: 20,
        height: 20,
        velocityX: 0,
        velocityY: 0,
        energy: 100,
        checkpoints: 0,
      },
    }))
  }, [])

  const togglePause = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      gameState: prev.gameState === "playing" ? "paused" : prev.gameState === "paused" ? "playing" : prev.gameState,
    }))
  }, [])

  const completeMiniGame = () => {
    if (!gameState.currentMiniGame) return

    const completedMiniGame = gameState.currentMiniGame
    setGameState((prev) => ({
      ...prev,
      gameState: "playing",
      currentMiniGame: null,
      score: prev.score + 500,
      miniGames: prev.miniGames.map((mg) =>
        mg.x === completedMiniGame.x && mg.y === completedMiniGame.y ? { ...mg, completed: true } : mg,
      ),
    }))
  }

  const renderLaserGame = (ctx: CanvasRenderingContext2D, mg: MiniGame) => {
    const data = mg.data
    const canvas = canvasRef.current

    if (!canvas) return

    ctx.fillStyle = "#ffffff"
    ctx.font = "20px monospace"
    ctx.textAlign = "center"
    ctx.fillText("ESQUIVA LOS LÁSERES", canvas.width / 2, 100)

    // Update power-up timers
    if (data.hasShield && data.shieldTime > 0) {
      data.shieldTime -= 1 / 60
      if (data.shieldTime <= 0) {
        data.hasShield = false
      }
    }

    if (data.hasBoost && data.boostTime > 0) {
      data.boostTime -= 1 / 60
      if (data.boostTime <= 0) {
        data.hasBoost = false
        data.speed = 3
      }
    }

    // Update laser positions
    data.lasers.forEach((laser: any) => {
      laser.x += Math.cos(laser.direction) * laser.speed
      laser.y += Math.sin(laser.direction) * laser.speed

      // Bounce off walls
      if (laser.x < 0 || laser.x > canvas.width - laser.width) {
        laser.direction = Math.PI - laser.direction
      }
      if (laser.y < 120 || laser.y > canvas.height - laser.height - 50) {
        laser.direction = -laser.direction
      }

      // Keep lasers in bounds
      laser.x = Math.max(0, Math.min(canvas.width - laser.width, laser.x))
      laser.y = Math.max(120, Math.min(canvas.height - laser.height - 50, laser.y))

      // Draw laser
      ctx.fillStyle = "#ff4444"
      ctx.shadowColor = "#ff4444"
      ctx.shadowBlur = 10
      ctx.fillRect(laser.x, laser.y, laser.width, laser.height)
      ctx.shadowBlur = 0
    })

    // Update player position based on keys
    const currentSpeed = data.hasBoost ? data.speed * 2 : data.speed
    if (gameState.keys["a"] || gameState.keys["arrowleft"]) {
      data.playerX = Math.max(0, data.playerX - currentSpeed)
    }
    if (gameState.keys["d"] || gameState.keys["arrowright"]) {
      data.playerX = Math.min(canvas.width - 20, data.playerX + currentSpeed)
    }
    if (gameState.keys["w"] || gameState.keys["arrowup"]) {
      data.playerY = Math.max(120, data.playerY - currentSpeed)
    }
    if (gameState.keys["s"] || gameState.keys["arrowdown"]) {
      data.playerY = Math.min(canvas.height - 70, data.playerY + currentSpeed)
    }

    // Draw and check power-ups
    data.powerUps.forEach((powerUp: any) => {
      if (!powerUp.collected) {
        // Draw power-up
        if (powerUp.type === "shield") {
          ctx.fillStyle = "#00ffff"
          ctx.shadowColor = "#00ffff"
        } else {
          ctx.fillStyle = "#ffff00"
          ctx.shadowColor = "#ffff00"
        }
        ctx.shadowBlur = 15
        ctx.fillRect(powerUp.x, powerUp.y, 15, 15)
        ctx.shadowBlur = 0

        // Check collection
        if (
          data.playerX < powerUp.x + 15 &&
          data.playerX + 20 > powerUp.x &&
          data.playerY < powerUp.y + 15 &&
          data.playerY + 20 > powerUp.y
        ) {
          powerUp.collected = true
          if (powerUp.type === "shield") {
            data.hasShield = true
            data.shieldTime = 5 // 5 seconds
          } else {
            data.hasBoost = true
            data.boostTime = 3 // 3 seconds
            data.speed = 6
          }
        }
      }
    })

    // Draw player with effects
    if (data.hasShield) {
      ctx.fillStyle = "#00ffff"
      ctx.shadowColor = "#00ffff"
      ctx.shadowBlur = 25
      ctx.fillRect(data.playerX - 5, data.playerY - 5, 30, 30)
      ctx.shadowBlur = 0
    }

    ctx.fillStyle = data.hasBoost ? "#ffff00" : "#00ff00"
    ctx.shadowColor = data.hasBoost ? "#ffff00" : "#00ff00"
    ctx.shadowBlur = 15
    ctx.fillRect(data.playerX, data.playerY, 20, 20)
    ctx.shadowBlur = 0

    // Draw goal area
    const goalX = canvas.width - 60
    const goalY = canvas.height - 80
    ctx.fillStyle = "#ffff00"
    ctx.shadowColor = "#ffff00"
    ctx.shadowBlur = 20
    ctx.fillRect(goalX, goalY, 40, 40)
    ctx.shadowBlur = 0

    // Goal text
    ctx.fillStyle = "#000000"
    ctx.font = "12px monospace"
    ctx.textAlign = "center"
    ctx.fillText("META", goalX + 20, goalY + 25)

    // Power-up status
    ctx.fillStyle = "#ffffff"
    ctx.font = "14px monospace"
    ctx.textAlign = "left"
    if (data.hasShield) {
      ctx.fillText(`Escudo: ${Math.ceil(data.shieldTime)}s`, 10, 140)
    }
    if (data.hasBoost) {
      ctx.fillText(`Boost: ${Math.ceil(data.boostTime)}s`, 10, 160)
    }

    // Instructions
    ctx.fillStyle = "#ffffff"
    ctx.font = "14px monospace"
    ctx.textAlign = "center"
    ctx.fillText("WASD/Flechas para mover • Azul=Escudo • Amarillo=Boost", canvas.width / 2, canvas.height - 20)

    // Check collision with lasers (only if no shield)
    if (!data.hasShield) {
      data.lasers.forEach((laser: any) => {
        if (
          data.playerX < laser.x + laser.width &&
          data.playerX + 20 > laser.x &&
          data.playerY < laser.y + laser.height &&
          data.playerY + 20 > laser.y
        ) {
          // Player hit laser - fail minigame
          setGameState((prev) => ({
            ...prev,
            gameState: "playing",
            currentMiniGame: null,
          }))
          return
        }
      })
    }

    // Check if player reached goal
    if (
      data.playerX + 10 > goalX &&
      data.playerX + 10 < goalX + 40 &&
      data.playerY + 10 > goalY &&
      data.playerY + 10 < goalY + 40
    ) {
      completeMiniGame()
    }
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setGameState((prev) => ({
        ...prev,
        keys: { ...prev.keys, [e.key.toLowerCase()]: true },
      }))

      // Activar minijuego con Espacio
      if (e.key === " " && gameState.gameState === "playing") {
        const player = gameState.player
        const playerCellX = Math.floor((player.x + player.width / 2) / gameState.cellSize)
        const playerCellY = Math.floor((player.y + player.height / 2) / gameState.cellSize)

        gameState.miniGames.forEach((miniGame) => {
          if (!miniGame.completed) {
            const distance = Math.abs(playerCellX - miniGame.x) + Math.abs(playerCellY - miniGame.y)
            if (distance <= 1) {
              setGameState((prev) => ({
                ...prev,
                gameState: "minigame",
                currentMiniGame: { ...miniGame, active: true },
              }))
            }
          }
        })
      }

      // Controles para minijuegos
      if (gameState.gameState === "minigame" && gameState.currentMiniGame) {
        const mg = gameState.currentMiniGame

        switch (mg.type) {
          case "memory":
            if (["1", "2", "3", "4"].includes(e.key) && !mg.data.showingSequence) {
              const input = Number.parseInt(e.key) - 1
              mg.data.playerSequence.push(input)

              if (
                mg.data.playerSequence[mg.data.playerSequence.length - 1] !==
                mg.data.sequence[mg.data.playerSequence.length - 1]
              ) {
                // Wrong input - reset
                mg.data.playerSequence = []
              } else if (mg.data.playerSequence.length === mg.data.sequence.length) {
                // Completed successfully
                completeMiniGame()
              }
            }
            break

          case "circuit":
            if (["q", "w", "e", "r"].includes(e.key)) {
              const inputIndex = ["q", "w", "e", "r"].indexOf(e.key)
              if (mg.data.playerConnections.length === inputIndex) {
                mg.data.playerConnections.push({ from: inputIndex, to: inputIndex })

                // Check completion
                if (mg.data.playerConnections.length >= 4) {
                  completeMiniGame()
                }
              }
            }
            break

          case "binary":
            if (e.key === "1" || e.key === "0") {
              const bits = mg.data.playerBinary.split("")
              bits[mg.data.currentBit] = e.key
              mg.data.playerBinary = bits.join("")
            } else if (e.key === "ArrowLeft") {
              mg.data.currentBit = Math.max(0, mg.data.currentBit - 1)
            } else if (e.key === "ArrowRight") {
              mg.data.currentBit = Math.min(7, mg.data.currentBit + 1)
            } else if (e.key === "Enter") {
              const decimal = Number.parseInt(mg.data.playerBinary, 2)
              if (decimal === mg.data.target) {
                completeMiniGame()
              }
            }
            break

          case "hacking":
            if (e.key >= "0" && e.key <= "9" && mg.data.currentCode.length < 4) {
              mg.data.currentCode += e.key
            } else if (e.key === "Backspace") {
              mg.data.currentCode = mg.data.currentCode.slice(0, -1)
            } else if (e.key === "Enter" && mg.data.currentCode.length === 4) {
              const inputCode = Number.parseInt(mg.data.currentCode)
              let found = false
              mg.data.codes.forEach((codeObj: any) => {
                if (codeObj.code === inputCode && !codeObj.cracked) {
                  codeObj.cracked = true
                  found = true
                }
              })
              if (!found) {
                mg.data.attempts--
              }
              mg.data.currentCode = ""
            }
            break
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setGameState((prev) => ({
        ...prev,
        keys: { ...prev.keys, [e.key.toLowerCase()]: false },
      }))
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState.gameState, gameState.player, gameState.miniGames, gameState.cellSize])

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const gameLoop = () => {
      if (gameState.gameState === "minigame") {
        renderMiniGame(ctx)
        return
      }

      if (gameState.gameState !== "playing") return

      // Clear canvas
      ctx.fillStyle = "#0a0a1a"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update player movement
      const player = { ...gameState.player }
      const speed = 1.5 // era 2

      let newX = player.x
      let newY = player.y

      if (gameState.keys["a"] || gameState.keys["arrowleft"]) {
        newX = Math.max(0, player.x - speed)
      }
      if (gameState.keys["d"] || gameState.keys["arrowright"]) {
        newX = Math.min((gameState.mazeWidth - 1) * gameState.cellSize - player.width, player.x + speed)
      }
      if (gameState.keys["w"] || gameState.keys["arrowup"]) {
        newY = Math.max(0, player.y - speed)
      }
      if (gameState.keys["s"] || gameState.keys["arrowdown"]) {
        newY = Math.min((gameState.mazeHeight - 1) * gameState.cellSize - player.height, player.y + speed)
      }

      // Debug temporal
      console.log("Player pos:", player.x, player.y, "Keys:", gameState.keys, "NewPos:", newX, newY)

      // Check collision with maze walls - FIXED VERSION
      const checkCollision = (x: number, y: number) => {
        const cellX = Math.floor(x / gameState.cellSize)
        const cellY = Math.floor(y / gameState.cellSize)
        const cellXRight = Math.floor((x + player.width - 1) / gameState.cellSize)
        const cellYBottom = Math.floor((y + player.height - 1) / gameState.cellSize)

        // Check bounds
        if (cellX < 0 || cellY < 0 || cellXRight >= gameState.mazeWidth || cellYBottom >= gameState.mazeHeight) {
          return true
        }

        // Check maze walls
        if (gameState.maze[cellY] && gameState.maze[cellY][cellX] === 1) return true
        if (gameState.maze[cellY] && gameState.maze[cellY][cellXRight] === 1) return true
        if (gameState.maze[cellYBottom] && gameState.maze[cellYBottom][cellX] === 1) return true
        if (gameState.maze[cellYBottom] && gameState.maze[cellYBottom][cellXRight] === 1) return true

        return false
      }

      // Apply movement if no collision
      if (!checkCollision(newX, player.y)) {
        player.x = newX
      }
      if (!checkCollision(player.x, newY)) {
        player.y = newY
      }

      // Update moving walls
      const updatedMovingWalls = gameState.movingWalls.map((wall) => {
        wall.timer++
        if (wall.timer >= wall.speed) {
          wall.timer = 0
          const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 1, dy: 0 }, // right
            { dx: 0, dy: 1 }, // down
            { dx: -1, dy: 0 }, // left
          ]
          const dir = directions[wall.direction]
          const newX = wall.x + dir.dx
          const newY = wall.y + dir.dy

          if (newX >= 0 && newX < gameState.mazeWidth && newY >= 0 && newY < gameState.mazeHeight) {
            wall.x = newX
            wall.y = newY
          } else {
            wall.direction = (wall.direction + 2) % 4 // Reverse direction
          }
        }
        return wall
      })

      // Update glitch zones
      const updatedGlitchZones = gameState.glitchZones.map((zone) => {
        zone.timer++
        if (zone.timer >= 180) {
          // 3 seconds
          zone.active = !zone.active
          zone.timer = 0
        }
        return zone
      })

      // Check minigame triggers
      gameState.miniGames.forEach((miniGame) => {
        if (!miniGame.completed) {
          const playerCellX = Math.floor((player.x + player.width / 2) / gameState.cellSize)
          const playerCellY = Math.floor((player.y + player.height / 2) / gameState.cellSize)
          const distance = Math.abs(playerCellX - miniGame.x) + Math.abs(playerCellY - miniGame.y)

          let color = "#00ff88"
          switch (miniGame.type) {
            case "memory":
              color = "#ff8800"
              break
            case "circuit":
              color = "#00ff88"
              break
            case "laser":
              color = "#ff4444"
              break
            case "binary":
              color = "#8800ff"
              break
            case "hacking":
              color = "#00ffff"
              break
          }

          ctx.fillStyle = color
          ctx.shadowColor = color
          ctx.shadowBlur = distance <= 1 ? 25 : 15 // Más brillo cuando estás cerca
          ctx.fillRect(
            miniGame.x * gameState.cellSize + 5,
            miniGame.y * gameState.cellSize + 5,
            gameState.cellSize - 10,
            gameState.cellSize - 10,
          )
          ctx.shadowBlur = 0

          // Mostrar texto de interacción cuando estés cerca
          if (distance <= 1) {
            ctx.fillStyle = "#ffffff"
            ctx.font = "10px monospace"
            ctx.textAlign = "center"
            ctx.fillText(
              "PRESIONA ESPACIO",
              miniGame.x * gameState.cellSize + gameState.cellSize / 2,
              miniGame.y * gameState.cellSize - 5,
            )
          }

          // Icon
          ctx.fillStyle = "#000000"
          ctx.font = "12px monospace"
          ctx.textAlign = "center"
          ctx.fillText(
            miniGame.type[0].toUpperCase(),
            miniGame.x * gameState.cellSize + gameState.cellSize / 2,
            miniGame.y * gameState.cellSize + gameState.cellSize / 2 + 4,
          )
        }
      })

      // Check goal
      const goalCellX = Math.floor(player.x / gameState.cellSize)
      const goalCellY = Math.floor(player.y / gameState.cellSize)

      if (goalCellX === gameState.goalX && goalCellY === gameState.goalY) {
        // Check if all minigames completed
        const allCompleted = gameState.miniGames.every((mg) => mg.completed)
        if (allCompleted) {
          if (gameState.level < 3) {
            const timeBonus = Math.floor(gameState.timeLeft) * 10
            setGameState((prev) => ({
              ...prev,
              score: prev.score + 1000 + timeBonus,
              level: prev.level + 1,
              gameState: "levelComplete",
            }))
            setTimeout(() => {
              initializeLevel(gameState.level + 1)
              setGameState((prev) => ({ ...prev, gameState: "playing" }))
            }, 2000)
          } else {
            setGameState((prev) => ({ ...prev, gameState: "gameComplete" }))
          }
          return
        }
      }

      // Update time
      const newTimeLeft = gameState.timeLeft - 1 / 60
      if (newTimeLeft <= 0) {
        setGameState((prev) => ({ ...prev, gameState: "gameOver" }))
        return
      }

      // Render maze
      for (let y = 0; y < gameState.mazeHeight; y++) {
        for (let x = 0; x < gameState.mazeWidth; x++) {
          const cellValue = gameState.maze[y] ? gameState.maze[y][x] : 1

          if (cellValue === 1) {
            // Wall
            ctx.fillStyle = "#2a2a4a"
            ctx.fillRect(x * gameState.cellSize, y * gameState.cellSize, gameState.cellSize, gameState.cellSize)

            // Wall border
            ctx.strokeStyle = "#4a4a6a"
            ctx.lineWidth = 1
            ctx.strokeRect(x * gameState.cellSize, y * gameState.cellSize, gameState.cellSize, gameState.cellSize)
          } else {
            // Path
            ctx.fillStyle = "#1a1a2a"
            ctx.fillRect(x * gameState.cellSize, y * gameState.cellSize, gameState.cellSize, gameState.cellSize)
          }
        }
      }

      // Render moving walls
      updatedMovingWalls.forEach((wall) => {
        ctx.fillStyle = "#ff4444"
        ctx.shadowColor = "#ff4444"
        ctx.shadowBlur = 10
        ctx.fillRect(wall.x * gameState.cellSize, wall.y * gameState.cellSize, gameState.cellSize, gameState.cellSize)
        ctx.shadowBlur = 0
      })

      // Render glitch zones
      updatedGlitchZones.forEach((zone) => {
        if (zone.active) {
          ctx.fillStyle = "#aa44ff80"
          ctx.fillRect(
            zone.x * gameState.cellSize,
            zone.y * gameState.cellSize,
            zone.width * gameState.cellSize,
            zone.height * gameState.cellSize,
          )
        }
      })

      // Check collision with moving walls (red squares) - they now damage player
      updatedMovingWalls.forEach((wall) => {
        const wallPixelX = wall.x * gameState.cellSize
        const wallPixelY = wall.y * gameState.cellSize

        if (
          player.x < wallPixelX + gameState.cellSize &&
          player.x + player.width > wallPixelX &&
          player.y < wallPixelY + gameState.cellSize &&
          player.y + player.height > wallPixelY
        ) {
          // Player hit moving wall - lose energy
          player.energy = Math.max(0, player.energy - 10)

          // Push player away from wall but keep in bounds
          const centerX = player.x + player.width / 2
          const centerY = player.y + player.height / 2
          const wallCenterX = wallPixelX + gameState.cellSize / 2
          const wallCenterY = wallPixelY + gameState.cellSize / 2

          const pushDistance = 15
          const pushX = centerX > wallCenterX ? pushDistance : -pushDistance
          const pushY = centerY > wallCenterY ? pushDistance : -pushDistance

          // Calculate new position with bounds checking
          let newPlayerX = player.x + pushX
          let newPlayerY = player.y + pushY

          // Keep player within maze bounds
          newPlayerX = Math.max(
            5,
            Math.min((gameState.mazeWidth - 1) * gameState.cellSize - player.width - 5, newPlayerX),
          )
          newPlayerY = Math.max(
            5,
            Math.min((gameState.mazeHeight - 1) * gameState.cellSize - player.height - 5, newPlayerY),
          )

          // Check if new position would be in a wall, if so find nearest safe position
          if (!checkCollision(newPlayerX, newPlayerY)) {
            player.x = newPlayerX
            player.y = newPlayerY
          } else {
            // Find nearest safe position
            for (let distance = 10; distance <= 50; distance += 10) {
              const directions = [
                { x: distance, y: 0 },
                { x: -distance, y: 0 },
                { x: 0, y: distance },
                { x: 0, y: -distance },
              ]

              for (const dir of directions) {
                const testX = Math.max(
                  5,
                  Math.min((gameState.mazeWidth - 1) * gameState.cellSize - player.width - 5, player.x + dir.x),
                )
                const testY = Math.max(
                  5,
                  Math.min((gameState.mazeHeight - 1) * gameState.cellSize - player.height - 5, player.y + dir.y),
                )

                if (!checkCollision(testX, testY)) {
                  player.x = testX
                  player.y = testY
                  break
                }
              }
            }
          }

          // Game over if energy reaches 0
          if (player.energy <= 0) {
            setGameState((prev) => ({ ...prev, gameState: "gameOver" }))
            return
          }
        }
      })

      // Render minigames
      gameState.miniGames.forEach((miniGame) => {
        if (!miniGame.completed) {
          const playerCellX = Math.floor((player.x + player.width / 2) / gameState.cellSize)
          const playerCellY = Math.floor((player.y + player.height / 2) / gameState.cellSize)
          const distance = Math.abs(playerCellX - miniGame.x) + Math.abs(playerCellY - miniGame.y)

          let color = "#00ff88"
          switch (miniGame.type) {
            case "memory":
              color = "#ff8800"
              break
            case "circuit":
              color = "#00ff88"
              break
            case "laser":
              color = "#ff4444"
              break
            case "binary":
              color = "#8800ff"
              break
            case "hacking":
              color = "#00ffff"
              break
          }

          ctx.fillStyle = color
          ctx.shadowColor = color
          ctx.shadowBlur = distance <= 1 ? 25 : 15 // Más brillo cuando estás cerca
          ctx.fillRect(
            miniGame.x * gameState.cellSize + 5,
            miniGame.y * gameState.cellSize + 5,
            gameState.cellSize - 10,
            gameState.cellSize - 10,
          )
          ctx.shadowBlur = 0

          // Mostrar texto de interacción cuando estés cerca
          if (distance <= 1) {
            ctx.fillStyle = "#ffffff"
            ctx.font = "10px monospace"
            ctx.textAlign = "center"
            ctx.fillText(
              "PRESIONA ESPACIO",
              miniGame.x * gameState.cellSize + gameState.cellSize / 2,
              miniGame.y * gameState.cellSize - 5,
            )
          }

          // Icon
          ctx.fillStyle = "#000000"
          ctx.font = "12px monospace"
          ctx.textAlign = "center"
          ctx.fillText(
            miniGame.type[0].toUpperCase(),
            miniGame.x * gameState.cellSize + gameState.cellSize / 2,
            miniGame.y * gameState.cellSize + gameState.cellSize / 2 + 4,
          )
        }
      })

      // Render goal
      ctx.fillStyle = "#ffff00"
      ctx.shadowColor = "#ffff00"
      ctx.shadowBlur = 20
      ctx.fillRect(
        gameState.goalX * gameState.cellSize,
        gameState.goalY * gameState.cellSize,
        gameState.cellSize,
        gameState.cellSize,
      )
      ctx.shadowBlur = 0

      // Render player
      ctx.fillStyle = "#00ff00"
      ctx.shadowColor = "#00ff00"
      ctx.shadowBlur = 15
      ctx.fillRect(player.x, player.y, player.width, player.height)
      ctx.shadowBlur = 0

      // Update state
      setGameState((prev) => ({
        ...prev,
        player,
        timeLeft: newTimeLeft,
        movingWalls: updatedMovingWalls,
        glitchZones: updatedGlitchZones,
      }))
    }

    const renderMiniGame = (ctx: CanvasRenderingContext2D) => {
      if (!gameState.currentMiniGame) return

      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const mg = gameState.currentMiniGame

      switch (mg.type) {
        case "memory":
          renderMemoryGame(ctx, mg)
          break
        case "circuit":
          renderCircuitGame(ctx, mg)
          break
        case "laser":
          renderLaserGame(ctx, mg)
          break
        case "binary":
          renderBinaryGame(ctx, mg)
          break
        case "hacking":
          renderHackingGame(ctx, mg)
          break
      }

      // Timer - ARREGLADO
      ctx.fillStyle = "#ffffff"
      ctx.font = "24px monospace"
      ctx.textAlign = "center"
      ctx.fillText(`Tiempo: ${Math.ceil(mg.timeLeft)}s`, canvas.width / 2, 50)

      // Update timer - ARREGLADO para que funcione correctamente
      if (mg.timeLeft > 0) {
        setGameState((prev) => ({
          ...prev,
          currentMiniGame: prev.currentMiniGame
            ? {
                ...prev.currentMiniGame,
                timeLeft: prev.currentMiniGame.timeLeft - 1 / 60,
              }
            : null,
        }))
      } else {
        // Time's up - fail minigame
        setGameState((prev) => ({
          ...prev,
          gameState: "playing",
          currentMiniGame: null,
        }))
      }
    }

    const renderMemoryGame = (ctx: CanvasRenderingContext2D, mg: MiniGame) => {
      const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"]
      const data = mg.data

      ctx.fillStyle = "#ffffff"
      ctx.font = "20px monospace"
      ctx.textAlign = "center"

      if (data.showingSequence) {
        ctx.fillText("MEMORIZA LA SECUENCIA", canvas.width / 2, 100)
        ctx.font = "16px monospace"
        ctx.fillText(`Mostrando: ${data.currentIndex + 1}/${data.sequence.length}`, canvas.width / 2, 130)
      } else {
        ctx.fillText("REPITE LA SECUENCIA", canvas.width / 2, 100)
        ctx.font = "16px monospace"
        ctx.fillText(`Progreso: ${data.playerSequence.length}/${data.sequence.length}`, canvas.width / 2, 130)
      }

      // Draw sequence buttons
      for (let i = 0; i < 4; i++) {
        const x = canvas.width / 2 - 200 + i * 100
        const y = 200

        // Base button
        ctx.fillStyle = colors[i]
        ctx.fillRect(x, y, 80, 80)

        // Border
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, 80, 80)

        // Highlight during sequence display
        if (data.showingSequence && data.currentIndex < data.sequence.length) {
          if (data.sequence[data.currentIndex] === i) {
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(x + 10, y + 10, 60, 60)
          }
        }

        // Button numbers
        ctx.fillStyle = "#000000"
        ctx.font = "24px monospace"
        ctx.textAlign = "center"
        ctx.fillText((i + 1).toString(), x + 40, y + 50)
      }

      // Handle sequence display timing - ARREGLADO
      if (data.showingSequence) {
        data.timer = (data.timer || 0) + 1
        if (data.timer >= 60) {
          // 1 segundo por item
          data.timer = 0
          data.currentIndex++
          if (data.currentIndex >= data.sequence.length) {
            data.showingSequence = false
            data.currentIndex = 0
          }
        }
      }

      // Instructions
      if (!data.showingSequence) {
        ctx.fillStyle = "#00ff00"
        ctx.font = "16px monospace"
        ctx.textAlign = "center"
        ctx.fillText("Presiona las teclas 1, 2, 3, o 4", canvas.width / 2, 320)
        ctx.fillText("en el mismo orden que se mostró", canvas.width / 2, 340)
      }

      // Show sequence for reference (after showing)
      if (!data.showingSequence && data.sequence.length > 0) {
        ctx.fillStyle = "#666666"
        ctx.font = "12px monospace"
        ctx.fillText("Secuencia objetivo: " + data.sequence.map((n) => n + 1).join(" "), canvas.width / 2, 380)
      }
    }

    const renderCircuitGame = (ctx: CanvasRenderingContext2D, mg: MiniGame) => {
      ctx.fillStyle = "#ffffff"
      ctx.font = "20px monospace"
      ctx.textAlign = "center"
      ctx.fillText("CONECTA LOS CIRCUITOS", canvas.width / 2, 100)

      const data = mg.data
      const leftSide = []
      const rightSide = []

      // Create connection points
      for (let i = 0; i < 4; i++) {
        leftSide.push({ x: 150, y: 150 + i * 80, id: i })
        rightSide.push({ x: 550, y: 150 + i * 80, id: i })
      }

      // Draw left side (inputs)
      leftSide.forEach((point, i) => {
        ctx.fillStyle = "#00ff88"
        ctx.fillRect(point.x - 25, point.y - 15, 50, 30)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.strokeRect(point.x - 25, point.y - 15, 50, 30)
        ctx.fillStyle = "#000000"
        ctx.font = "16px monospace"
        ctx.textAlign = "center"
        ctx.fillText(`IN${i + 1}`, point.x, point.y + 5)
      })

      // Draw right side (outputs)
      rightSide.forEach((point, i) => {
        ctx.fillStyle = "#ff8800"
        ctx.fillRect(point.x - 25, point.y - 15, 50, 30)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.strokeRect(point.x - 25, point.y - 15, 50, 30)
        ctx.fillStyle = "#000000"
        ctx.font = "16px monospace"
        ctx.textAlign = "center"
        ctx.fillText(`OUT${i + 1}`, point.x, point.y + 5)
      })

      // Draw connections
      data.playerConnections.forEach((conn: any, index: number) => {
        if (conn.from !== -1 && conn.to !== -1) {
          const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"]
          ctx.strokeStyle = colors[index % colors.length]
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(leftSide[conn.from].x + 25, leftSide[conn.from].y)
          ctx.lineTo(rightSide[conn.to].x - 25, rightSide[conn.to].y)
          ctx.stroke()
        }
      })

      // Instructions
      ctx.fillStyle = "#00ff00"
      ctx.font = "16px monospace"
      ctx.textAlign = "center"
      ctx.fillText("Presiona Q, W, E, R para conectar", canvas.width / 2, 480)
      ctx.fillText("IN1→OUT1, IN2→OUT2, IN3→OUT3, IN4→OUT4", canvas.width / 2, 500)
      ctx.fillText(`Conexiones: ${data.playerConnections.length}/4`, canvas.width / 2, 520)

      // Show current connection being made
      if (data.playerConnections.length < 4) {
        const nextInput = data.playerConnections.length
        ctx.fillStyle = "#ffff00"
        ctx.font = "14px monospace"
        ctx.fillText(
          `Siguiente: IN${nextInput + 1} → presiona ${["Q", "W", "E", "R"][nextInput]}`,
          canvas.width / 2,
          540,
        )
      }
    }

    const renderBinaryGame = (ctx: CanvasRenderingContext2D, mg: MiniGame) => {
      const data = mg.data

      ctx.fillStyle = "#ffffff"
      ctx.font = "20px monospace"
      ctx.textAlign = "center"
      ctx.fillText(`CONVIERTE ${data.target} A BINARIO`, canvas.width / 2, 100)

      // Draw binary digits with borders
      const startX = canvas.width / 2 - 128
      for (let i = 0; i < 8; i++) {
        const x = startX + i * 32
        const y = 180

        // Cell background
        ctx.fillStyle = i === data.currentBit ? "#333333" : "#111111"
        ctx.fillRect(x - 16, y, 32, 40)

        // Cell border
        ctx.strokeStyle = i === data.currentBit ? "#ffff00" : "#666666"
        ctx.lineWidth = 2
        ctx.strokeRect(x - 16, y, 32, 40)

        // Digit
        ctx.fillStyle = "#ffffff"
        ctx.font = "24px monospace"
        ctx.textAlign = "center"
        ctx.fillText(data.playerBinary[i], x, y + 28)
      }

      // Instructions
      ctx.fillStyle = "#00ff00"
      ctx.font = "16px monospace"
      ctx.textAlign = "center"
      ctx.fillText("Usa 1 y 0 para cambiar bits", canvas.width / 2, 250)
      ctx.fillText("Flechas ← → para mover cursor", canvas.width / 2, 270)
      ctx.fillText("ENTER para confirmar respuesta", canvas.width / 2, 290)

      // Show decimal equivalent
      const decimal = Number.parseInt(data.playerBinary, 2)
      ctx.fillStyle = "#ffffff"
      ctx.fillText(`Decimal actual: ${decimal}`, canvas.width / 2, 320)

      // Check if correct
      if (decimal === data.target) {
        ctx.fillStyle = "#00ff00"
        ctx.font = "20px monospace"
        ctx.fillText("¡CORRECTO! Presiona ENTER", canvas.width / 2, 350)
      }
    }

    const renderHackingGame = (ctx: CanvasRenderingContext2D, mg: MiniGame) => {
      ctx.fillStyle = "#ffffff"
      ctx.font = "20px monospace"
      ctx.textAlign = "center"
      ctx.fillText("HACKEA LOS CÓDIGOS", canvas.width / 2, 100)

      const data = mg.data

      // Draw codes to crack
      data.codes.forEach((codeObj: any, i: number) => {
        const x = 100 + (i % 3) * 200
        const y = 150 + Math.floor(i / 3) * 100

        // Code box
        ctx.fillStyle = codeObj.cracked ? "#00ff00" : "#ff4444"
        ctx.fillRect(x, y, 150, 60)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, 150, 60)

        // Code number
        ctx.fillStyle = "#000000"
        ctx.font = "16px monospace"
        ctx.textAlign = "center"
        if (codeObj.cracked) {
          ctx.fillText("CRACKEADO", x + 75, y + 35)
        } else {
          ctx.fillText(`${codeObj.code}`, x + 75, y + 35)
        }
      })

      // Input area
      ctx.fillStyle = "#333333"
      ctx.fillRect(canvas.width / 2 - 100, 400, 200, 40)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.strokeRect(canvas.width / 2 - 100, 400, 200, 40)

      // Current input
      ctx.fillStyle = "#ffffff"
      ctx.font = "20px monospace"
      ctx.textAlign = "center"
      ctx.fillText(data.currentCode, canvas.width / 2, 425)

      // Instructions
      ctx.fillStyle = "#00ff00"
      ctx.font = "16px monospace"
      ctx.fillText("Escribe los códigos de 4 dígitos", canvas.width / 2, 480)
      ctx.fillText("ENTER para confirmar • BACKSPACE para borrar", canvas.width / 2, 500)
      ctx.fillText(`Intentos restantes: ${data.attempts}`, canvas.width / 2, 520)

      // Check completion
      if (data.codes.every((code: any) => code.cracked)) {
        ctx.fillStyle = "#00ff00"
        ctx.font = "20px monospace"
        ctx.fillText("¡TODOS LOS CÓDIGOS CRACKEADOS!", canvas.width / 2, 550)
        setTimeout(() => completeMiniGame(), 1000)
      }

      // Check failure
      if (data.attempts <= 0) {
        setGameState((prev) => ({
          ...prev,
          gameState: "playing",
          currentMiniGame: null,
        }))
      }
    }

    if (gameState.gameState === "playing" || gameState.gameState === "minigame") {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, initializeLevel])

  // Initialize audio
  useEffect(() => {
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

        // Create retro 8-bit style background music
        const playBackgroundMusic = () => {
          if (!audioContextRef.current) return

          const ctx = audioContextRef.current

          // Create multiple oscillators for retro sound
          const createRetroTrack = () => {
            // Crear múltiples osciladores para sonido retro más complejo
            const bass = ctx.createOscillator()
            const melody = ctx.createOscillator()
            const harmony = ctx.createOscillator()

            const bassGain = ctx.createGain()
            const melodyGain = ctx.createGain()
            const harmonyGain = ctx.createGain()

            // Conectar osciladores
            bass.connect(bassGain)
            melody.connect(melodyGain)
            harmony.connect(harmonyGain)

            bassGain.connect(ctx.destination)
            melodyGain.connect(ctx.destination)
            harmonyGain.connect(ctx.destination)

            // Configurar tipos de onda retro
            bass.type = "square"
            melody.type = "triangle"
            harmony.type = "sawtooth"

            // Configurar volúmenes
            bassGain.gain.setValueAtTime(0.15, ctx.currentTime)
            melodyGain.gain.setValueAtTime(0.08, ctx.currentTime)
            harmonyGain.gain.setValueAtTime(0.05, ctx.currentTime)

            // Patrones musicales retro estilo 8-bit
            const bassNotes = [65.41, 87.31, 98.0, 130.81] // C2, F2, G2, C3
            const melodyNotes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63] // C4, E4, G4, C5, G4, E4
            const harmonyNotes = [130.81, 164.81, 196.0, 261.63] // C3, E3, G3, C4

            let bassIndex = 0
            let melodyIndex = 0
            let harmonyIndex = 0

            // Funciones de actualización de notas
            const updateBass = () => {
              if (bass && ctx) {
                bass.frequency.setValueAtTime(bassNotes[bassIndex], ctx.currentTime)
                bassIndex = (bassIndex + 1) % bassNotes.length
              }
            }

            const updateMelody = () => {
              if (melody && ctx) {
                melody.frequency.setValueAtTime(melodyNotes[melodyIndex], ctx.currentTime)
                melodyIndex = (melodyIndex + 1) % melodyNotes.length
              }
            }

            const updateHarmony = () => {
              if (harmony && ctx) {
                harmony.frequency.setValueAtTime(harmonyNotes[harmonyIndex], ctx.currentTime)
                harmonyIndex = (harmonyIndex + 1) % harmonyNotes.length
              }
            }

            // Timing retro - diferentes velocidades para crear ritmo
            setInterval(updateBass, 500) // Bass cada 500ms
            setInterval(updateMelody, 250) // Melodía cada 250ms
            setInterval(updateHarmony, 1000) // Armonía cada 1000ms

            // Iniciar osciladores
            bass.start()
            melody.start()
            harmony.start()

            oscillatorRef.current = bass
            gainNodeRef.current = bassGain
          }

          createRetroTrack()
        }

        // Start music when game starts
        if (gameState.gameState === "playing") {
          playBackgroundMusic()
        }
      } catch (error) {
        console.log("Audio not supported")
      }
    }

    initAudio()

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current = null
      }
    }
  }, [gameState.gameState])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>

          <div className="flex items-center space-x-4">
            <Button onClick={togglePause} disabled={gameState.gameState === "menu"}>
              {gameState.gameState === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button onClick={resetGame}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-white">{gameState.score}</div>
              <div className="text-xs text-gray-400">Puntos</div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-cyan-500/30">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-cyan-400">{gameState.level}</div>
              <div className="text-xs text-gray-400">Nivel</div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-yellow-500/30">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-yellow-400">{Math.max(0, Math.floor(gameState.timeLeft))}</div>
              <div className="text-xs text-gray-400">Tiempo</div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-green-500/30">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-green-400">{gameState.player.checkpoints}</div>
              <div className="text-xs text-gray-400">Checkpoints</div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-orange-500/30">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-orange-400">
                {gameState.miniGames.filter((mg) => mg.completed).length}/{gameState.miniGames.length}
              </div>
              <div className="text-xs text-gray-400">Minijuegos</div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-blue-500/30">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-blue-400">{Math.round(gameState.player.energy)}</div>
              <div className="text-xs text-gray-400">Energía</div>
            </CardContent>
          </Card>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={750}
            height={570}
            className="border border-purple-500/30 bg-slate-900 mx-auto block"
          />

          {/* Game State Overlays */}
          {gameState.gameState === "menu" && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
              <Card className="bg-gradient-to-br from-slate-800/95 to-purple-900/95 border-purple-500/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    HEX: LABERINTOS CYBERPUNK
                  </CardTitle>
                  <div className="space-y-2 text-gray-300">
                    <p>
                      <strong>WASD/Flechas:</strong> Movimiento por el laberinto
                    </p>
                    <p>
                      <strong>Objetivo:</strong> Completa todos los minijuegos (iconos de colores)
                    </p>
                    <p>
                      <strong>Meta:</strong> Llega al cuadrado amarillo después de completar minijuegos
                    </p>
                    <p className="text-cyan-400">
                      <strong>¡Cada nivel tiene laberintos más complejos!</strong>
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    onClick={startGame}
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 text-xl px-8 py-3"
                  >
                    <Map className="mr-2 h-5 w-5" />
                    EXPLORAR LABERINTOS
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {gameState.gameState === "minigame" && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-orange-600/90 text-white text-lg px-4 py-2 animate-pulse">
                <Puzzle className="mr-2 h-4 w-4" />
                MINIJUEGO ACTIVO
              </Badge>
            </div>
          )}

          {gameState.gameState === "paused" && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Card className="bg-gradient-to-br from-slate-800/90 to-purple-900/90 border-purple-500/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white">Exploración Pausada</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Button onClick={togglePause} size="lg">
                    <Play className="mr-2 h-4 w-4" />
                    Continuar
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {gameState.gameState === "gameOver" && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Card className="bg-gradient-to-br from-red-900/90 to-slate-800/90 border-red-500/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl text-red-400 mb-4">Tiempo Agotado</CardTitle>
                  <p className="text-gray-300">El laberinto se ha cerrado permanentemente</p>
                  <p className="text-gray-300">Puntuación Final: {gameState.score}</p>
                </CardHeader>
                <CardContent className="text-center space-x-4">
                  <Button onClick={startGame} className="bg-gradient-to-r from-cyan-500 to-purple-600">
                    Intentar de Nuevo
                  </Button>
                  <Link href="/">
                    <Button variant="outline" className="border-purple-500/50 text-purple-300">
                      Menú Principal
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {gameState.gameState === "levelComplete" && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Card className="bg-gradient-to-br from-green-900/90 to-slate-800/90 border-green-500/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl text-green-400 mb-4">¡Laberinto Completado!</CardTitle>
                  <p className="text-gray-300">Preparando siguiente nivel...</p>
                </CardHeader>
              </Card>
            </div>
          )}

          {gameState.gameState === "gameComplete" && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Card className="bg-gradient-to-br from-yellow-900/90 to-slate-800/90 border-yellow-500/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl text-yellow-400 mb-4">¡Misión Completada!</CardTitle>
                  <p className="text-gray-300">Has navegado todos los laberintos del Ciberplaneta Z-01</p>
                  <p className="text-gray-300">Puntuación Final: {gameState.score}</p>
                </CardHeader>
                <CardContent className="text-center space-x-4">
                  <Button onClick={startGame} className="bg-gradient-to-r from-cyan-500 to-purple-600">
                    Explorar de Nuevo
                  </Button>
                  <Link href="/">
                    <Button variant="outline" className="border-purple-500/50 text-purple-300">
                      Menú Principal
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Current Level Info */}
        {gameState.gameState === "playing" && (
          <div className="mt-6">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Nivel {gameState.level}: {LEVELS[gameState.level - 1]?.name}
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    <Badge className="bg-orange-600/20 text-orange-300">
                      <Puzzle className="mr-1 h-3 w-3" />
                      {gameState.miniGames.filter((mg) => mg.completed).length}/{gameState.miniGames.length} Minijuegos
                    </Badge>
                    <Badge style={{ backgroundColor: LEVELS[gameState.level - 1]?.color + "40" }}>
                      <Map className="mr-1 h-3 w-3" />
                      Laberinto Activo
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Minigame Legend */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-400">M = Memoria</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-400">C = Circuitos</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-400">L = Láseres</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-gray-400">B = Binario</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-cyan-500 rounded"></div>
            <span className="text-gray-400">H = Hackeo</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            <strong>Controles:</strong> WASD/Flechas = Movimiento • P = Pausa • Toca iconos de colores para minijuegos
          </p>
          <p className="text-gray-500 text-xs mt-1">Completa todos los minijuegos antes de llegar a la meta amarilla</p>
        </div>
      </div>
    </div>
  )
}
