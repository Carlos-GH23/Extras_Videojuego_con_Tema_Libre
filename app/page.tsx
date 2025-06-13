import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, Trophy, Gamepad2, Cpu, Battery, Target, Puzzle, Map } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">HEX</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="#historia" className="text-gray-300 hover:text-cyan-400 transition-colors">
              Historia
            </Link>
            <Link href="#laberintos" className="text-gray-300 hover:text-cyan-400 transition-colors">
              Laberintos
            </Link>
            <Link href="#minijuegos" className="text-gray-300 hover:text-cyan-400 transition-colors">
              Minijuegos
            </Link>
          </nav>
          <Link href="/game">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <Gamepad2 className="mr-2 h-4 w-4" />
              Explorar Laberintos
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-purple-600/20 text-purple-300 border-purple-500/30">
              Año 3025 • Laberintos Digitales
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              HEX: LABERINTOS DEL
              <br />
              CIBERPLANETA Z-01
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Navega por laberintos corruptos, resuelve puzzles cyberpunk y hackea sistemas para escapar. Cada nivel
              presenta laberintos más complejos y minijuegos desafiantes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/game">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-lg px-8 py-3"
                >
                  <Map className="mr-2 h-5 w-5" />
                  Iniciar Exploración
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 text-lg px-8 py-3"
              >
                Ver Gameplay
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section id="historia" className="py-16 px-4 bg-black/20">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">Historia del Juego</h2>
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 border-purple-500/30">
              <CardContent className="p-8">
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  En el año <span className="text-cyan-400 font-semibold">3025</span>, la IA central del
                  <span className="text-purple-400 font-semibold"> Ciberplaneta Z-01</span> ha creado laberintos
                  digitales imposibles como sistema de defensa contra intrusos.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  Tú eres <span className="text-cyan-400 font-semibold">Hex</span>, un androide explorador especializado
                  en navegación de sistemas complejos. Debes atravesar estos laberintos corruptos, resolver puzzles de
                  seguridad y hackear terminales para llegar a los nodos de diagnóstico.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Cada laberinto presenta nuevos desafíos: paredes que se mueven, puertas codificadas, minijuegos de
                  hackeo y <span className="text-red-400 font-semibold">tiempo limitado</span>. Solo los androides más
                  hábiles pueden escapar antes del colapso total.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Laberintos */}
      <section id="laberintos" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">Laberintos Progresivos</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Nivel 1 */}
            <Card className="bg-gradient-to-br from-green-900/30 to-slate-800/50 border-green-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-600/20 text-green-300 border-green-500/30">Nivel 1</Badge>
                  <Map className="h-5 w-5 text-green-400" />
                </div>
                <CardTitle className="text-green-400">Circuito Básico</CardTitle>
                <CardDescription className="text-gray-300">Laberinto de introducción con tutorial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Características:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Laberinto estático simple</li>
                      <li>• 2-3 minijuegos básicos</li>
                      <li>• Tutorial de controles</li>
                      <li>• Checkpoints frecuentes</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Minijuegos:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Secuencia de memoria</li>
                      <li>• Conexión de circuitos</li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
                    <span className="text-green-400 font-semibold">Tiempo: 3 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nivel 2 */}
            <Card className="bg-gradient-to-br from-yellow-900/30 to-slate-800/50 border-yellow-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">Nivel 2</Badge>
                  <Map className="h-5 w-5 text-yellow-400" />
                </div>
                <CardTitle className="text-yellow-400">Núcleo Dinámico</CardTitle>
                <CardDescription className="text-gray-300">Laberinto con elementos móviles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Características:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Paredes que se mueven</li>
                      <li>• Puertas temporizadas</li>
                      <li>• 4-5 minijuegos intermedios</li>
                      <li>• Zonas de glitch</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Minijuegos:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Hackeo de terminales</li>
                      <li>• Esquivar patrones láser</li>
                      <li>• Decodificación binaria</li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-yellow-500/20">
                    <span className="text-yellow-400 font-semibold">Tiempo: 4 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nivel 3 */}
            <Card className="bg-gradient-to-br from-red-900/30 to-slate-800/50 border-red-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-red-600/20 text-red-300 border-red-500/30">Nivel 3</Badge>
                  <Map className="h-5 w-5 text-red-400" />
                </div>
                <CardTitle className="text-red-400">Laberinto Caótico</CardTitle>
                <CardDescription className="text-gray-300">Desafío máximo con IA adaptativa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Características:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Laberinto que se reconfigura</li>
                      <li>• IA que adapta dificultad</li>
                      <li>• 6+ minijuegos avanzados</li>
                      <li>• Múltiples rutas falsas</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Minijuegos:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Puzzles de lógica compleja</li>
                      <li>• Secuencias múltiples</li>
                      <li>• Hackeo bajo presión</li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-red-500/20">
                    <span className="text-red-400 font-semibold">Tiempo: 5 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Minijuegos */}
      <section id="minijuegos" className="py-16 px-4 bg-black/20">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">Minijuegos Integrados</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 border-purple-500/30">
              <CardHeader className="text-center">
                <Puzzle className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                <CardTitle className="text-white">Secuencia de Memoria</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-300 mb-3">
                  Memoriza y repite secuencias de colores para hackear puertas de seguridad.
                </p>
                <Badge className="bg-purple-600/20 text-purple-300">Tiempo: 30s</Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-cyan-900/30 border-cyan-500/30">
              <CardHeader className="text-center">
                <Zap className="h-12 w-12 text-cyan-400 mx-auto mb-2" />
                <CardTitle className="text-white">Conexión de Circuitos</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-300 mb-3">
                  Conecta los circuitos correctamente para restaurar el flujo de energía.
                </p>
                <Badge className="bg-cyan-600/20 text-cyan-300">Tiempo: 45s</Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-green-900/30 border-green-500/30">
              <CardHeader className="text-center">
                <Target className="h-12 w-12 text-green-400 mx-auto mb-2" />
                <CardTitle className="text-white">Esquivar Láseres</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-300 mb-3">
                  Navega a través de patrones de láser en movimiento sin ser detectado.
                </p>
                <Badge className="bg-green-600/20 text-green-300">Tiempo: 60s</Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-orange-900/30 border-orange-500/30">
              <CardHeader className="text-center">
                <Battery className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                <CardTitle className="text-white">Hackeo de Terminal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-300 mb-3">
                  Decodifica secuencias binarias y resuelve puzzles de lógica digital.
                </p>
                <Badge className="bg-orange-600/20 text-orange-300">Tiempo: 90s</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Características del Juego */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">Características del Juego</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 border-purple-500/30">
              <CardHeader className="text-center">
                <Trophy className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                <CardTitle className="text-white">Sistema de Puntuación</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>+500 por minijuego perfecto</li>
                  <li>+200 por checkpoint</li>
                  <li>+1000 bonus de tiempo</li>
                  <li>Multiplicador por velocidad</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-cyan-900/30 border-cyan-500/30">
              <CardHeader className="text-center">
                <Map className="h-12 w-12 text-cyan-400 mx-auto mb-2" />
                <CardTitle className="text-white">Laberintos Dinámicos</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>Paredes móviles</li>
                  <li>Puertas temporizadas</li>
                  <li>Zonas de glitch</li>
                  <li>Rutas secretas</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-green-900/30 border-green-500/30">
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-green-400 mx-auto mb-2" />
                <CardTitle className="text-white">Presión Temporal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>Cronómetro por nivel</li>
                  <li>Minijuegos con límite</li>
                  <li>Bonus por velocidad</li>
                  <li>Penalización por lentitud</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-orange-900/30 border-orange-500/30">
              <CardHeader className="text-center">
                <Puzzle className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                <CardTitle className="text-white">Dificultad Adaptativa</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>IA que aprende tu estilo</li>
                  <li>Complejidad creciente</li>
                  <li>Múltiples soluciones</li>
                  <li>Desafíos únicos</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">¿Listo para el Desafío Mental?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Los laberintos del Ciberplaneta Z-01 pondrán a prueba tu lógica, velocidad y habilidad estratégica. ¿Podrás
            resolver todos los puzzles antes de que colapse el sistema?
          </p>
          <Link href="/game">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-xl px-12 py-4"
            >
              <Puzzle className="mr-3 h-6 w-6" />
              Comenzar Exploración
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 bg-black/40 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Cpu className="h-6 w-6 text-cyan-400" />
            <span className="text-xl font-bold text-white">HEX</span>
          </div>
          <p className="text-gray-400">© 2025 Hex: Laberintos del Ciberplaneta Z-01. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
