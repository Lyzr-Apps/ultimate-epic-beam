import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Trophy, RotateCw, Send, User, Zap, CheckCircle, XCircle, Sparkles } from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'

// Agent ID from workflow.json
const AGENT_ID = "69787493a75ef8a94cc4f20c"

// TypeScript interfaces based on actual_test_response
interface Question {
  text: string
  category: string
}

interface LastAnswerResult {
  player: string
  answer_given: string
  correct_answer: string
  is_correct: boolean
  points_awarded: number
}

interface Scores {
  player1: number
  player2: number
}

interface LeaderboardEntry {
  player: string
  score: number
}

interface GameResult {
  game_status: string
  current_round: number
  current_turn: string
  question: Question
  last_answer_result: LastAnswerResult | null
  scores: Scores
  leaderboard: LeaderboardEntry[]
  winner: string | null
  game_message: string
}

interface ChatMessage {
  player: string
  type: 'question' | 'answer' | 'result'
  text: string
  isCorrect?: boolean
}

// Player panel component
function PlayerPanel({
  playerName,
  score,
  isActive,
  chatHistory,
  answer,
  onAnswerChange,
  onSubmit,
  loading,
  playerColor,
  gradientFrom,
  gradientTo
}: {
  playerName: string
  score: number
  isActive: boolean
  chatHistory: ChatMessage[]
  answer: string
  onAnswerChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
  playerColor: string
  gradientFrom: string
  gradientTo: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory])

  return (
    <Card className={`flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden transition-all duration-500 ${isActive ? 'ring-4 ring-green-400 shadow-2xl shadow-green-500/20 scale-[1.02]' : 'opacity-90'}`}>
      <CardHeader className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white py-5 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${isActive ? 'bg-white/20' : 'bg-white/10'} flex items-center justify-center backdrop-blur-sm`}>
                <User className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{playerName}</CardTitle>
                <p className="text-xs text-white/80 font-medium">Trivia Champion</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70 uppercase tracking-wider">Score</p>
              <p className="text-3xl font-black">{score}</p>
            </div>
          </div>
          {isActive && (
            <Badge className="bg-green-500 text-white font-bold px-4 py-1.5 animate-pulse shadow-lg">
              <Zap className="w-3 h-3 mr-1.5" />
              YOUR TURN
            </Badge>
          )}
          {!isActive && (
            <Badge variant="outline" className="border-white/30 text-white/60 font-semibold px-4 py-1.5">
              WAITING...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-5 gap-4 bg-slate-900/50">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {chatHistory.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Waiting for questions...</p>
              </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className="space-y-1 animate-in slide-in-from-bottom-2">
                {msg.type === 'question' && (
                  <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 p-4 rounded-xl backdrop-blur-sm">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-bold text-purple-300 uppercase tracking-wide">Question</p>
                    </div>
                    <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                  </div>
                )}
                {msg.type === 'answer' && (
                  <div className="bg-slate-800/60 border border-slate-600/50 p-4 rounded-xl backdrop-blur-sm ml-4">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Your Answer:</p>
                    <p className="text-sm text-white font-medium">{msg.text}</p>
                  </div>
                )}
                {msg.type === 'result' && (
                  <div className={`p-4 rounded-xl border-2 ${msg.isCorrect ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'} backdrop-blur-sm ml-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      {msg.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <p className={`text-sm font-bold ${msg.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {msg.isCorrect ? 'Correct!' : 'Incorrect'}
                      </p>
                    </div>
                    <p className="text-sm text-white/90">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="space-y-3 pt-2 border-t border-slate-700/50">
          <Input
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={isActive ? "Type your answer..." : "Wait for your turn..."}
            disabled={!isActive || loading}
            className={`w-full bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 px-4 text-base rounded-xl ${isActive ? 'ring-2 ring-green-500/20' : ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isActive && !loading && answer.trim()) {
                onSubmit()
              }
            }}
          />
          <Button
            onClick={onSubmit}
            disabled={!isActive || loading || !answer.trim()}
            className={`w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:scale-100`}
          >
            <Send className="w-5 h-5 mr-2" />
            {loading ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Leaderboard component
function LeaderboardPanel({
  leaderboard,
  currentTurn,
  currentRound
}: {
  leaderboard: LeaderboardEntry[]
  currentTurn: string
  currentRound: number
}) {
  return (
    <Card className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white border-purple-500/30 shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <CardTitle className="text-2xl font-black">Live Leaderboard</CardTitle>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge className="bg-white/10 text-white border-white/20 font-bold px-4 py-1.5">
            Round {currentRound} / 10
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        {leaderboard.map((entry, idx) => {
          const isLeading = idx === 0 && leaderboard.length > 1 && entry.score > leaderboard[1].score
          const isActiveTurn = entry.player === currentTurn

          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl transition-all duration-500 relative overflow-hidden ${
                isActiveTurn
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white ring-4 ring-green-400/50 shadow-xl shadow-green-500/30 scale-105'
                  : 'bg-white/5 backdrop-blur-sm border border-white/10'
              }`}
            >
              {isLeading && !isActiveTurn && (
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/10 rounded-bl-full"></div>
              )}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                    isActiveTurn
                      ? 'bg-white/20 text-white'
                      : isLeading
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/80'
                  }`}>
                    {isLeading && !isActiveTurn ? <Trophy className="w-6 h-6" /> : idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{entry.player}</p>
                    {isActiveTurn && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Zap className="w-3 h-3 animate-pulse" />
                        <p className="text-xs font-bold uppercase tracking-wide">Playing Now</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-0.5">Points</p>
                  <p className="text-4xl font-black">{entry.score}</p>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// Current question display component
function QuestionDisplay({ question }: { question: Question | null }) {
  if (!question) return null

  return (
    <Card className="bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white border-none shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      <CardContent className="p-8 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <Badge className="bg-white text-purple-600 font-bold px-4 py-1.5 text-sm shadow-lg">
              {question.category}
            </Badge>
          </div>
          <p className="text-2xl font-bold leading-relaxed">
            {question.text}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Home component
export default function Home() {
  const [gameResponse, setGameResponse] = useState<GameResult | null>(null)
  const [player1Answer, setPlayer1Answer] = useState('')
  const [player2Answer, setPlayer2Answer] = useState('')
  const [player1Chat, setPlayer1Chat] = useState<ChatMessage[]>([])
  const [player2Chat, setPlayer2Chat] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [sessionId] = useState(() => `game-${Date.now()}`)

  // Start new game
  const startNewGame = async () => {
    setLoading(true)
    setPlayer1Chat([])
    setPlayer2Chat([])
    setPlayer1Answer('')
    setPlayer2Answer('')
    setShowWinnerModal(false)

    try {
      const result = await callAIAgent(
        "Start new game",
        AGENT_ID,
        { session_id: sessionId }
      )

      if (result.success && result.response.status === 'success') {
        const gameData = result.response.result as GameResult
        setGameResponse(gameData)

        // Add first question to chat
        if (gameData.question) {
          const questionMsg: ChatMessage = {
            player: gameData.current_turn,
            type: 'question',
            text: gameData.question.text
          }
          if (gameData.current_turn === 'Player 1') {
            setPlayer1Chat([questionMsg])
          } else {
            setPlayer2Chat([questionMsg])
          }
        }
      }
    } catch (error) {
      console.error('Failed to start game:', error)
    } finally {
      setLoading(false)
    }
  }

  // Submit answer
  const submitAnswer = async (player: 'Player 1' | 'Player 2', answer: string) => {
    if (!answer.trim() || loading) return

    setLoading(true)
    const isPlayer1 = player === 'Player 1'

    // Add answer to chat immediately
    const answerMsg: ChatMessage = {
      player,
      type: 'answer',
      text: answer
    }

    if (isPlayer1) {
      setPlayer1Chat(prev => [...prev, answerMsg])
      setPlayer1Answer('')
    } else {
      setPlayer2Chat(prev => [...prev, answerMsg])
      setPlayer2Answer('')
    }

    try {
      const result = await callAIAgent(
        `${player}: ${answer}`,
        AGENT_ID,
        { session_id: sessionId }
      )

      if (result.success && result.response.status === 'success') {
        const gameData = result.response.result as GameResult
        setGameResponse(gameData)

        // Add result to the player's chat
        if (gameData.last_answer_result) {
          const resultMsg: ChatMessage = {
            player: gameData.last_answer_result.player,
            type: 'result',
            text: gameData.game_message,
            isCorrect: gameData.last_answer_result.is_correct
          }

          if (gameData.last_answer_result.player === 'Player 1') {
            setPlayer1Chat(prev => [...prev, resultMsg])
          } else {
            setPlayer2Chat(prev => [...prev, resultMsg])
          }
        }

        // Add next question to the next player's chat
        if (gameData.question && gameData.game_status === 'in_progress') {
          const questionMsg: ChatMessage = {
            player: gameData.current_turn,
            type: 'question',
            text: gameData.question.text
          }

          if (gameData.current_turn === 'Player 1') {
            setPlayer1Chat(prev => [...prev, questionMsg])
          } else {
            setPlayer2Chat(prev => [...prev, questionMsg])
          }
        }

        // Show winner modal if game completed
        if (gameData.game_status === 'completed' && gameData.winner) {
          setTimeout(() => setShowWinnerModal(true), 1000)
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initialize game on mount
  useEffect(() => {
    startNewGame()
  }, [])

  const currentTurn = gameResponse?.current_turn || 'Player 1'
  const isPlayer1Turn = currentTurn === 'Player 1'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-6">
      {/* Animated background pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                  Trivia Duel
                </h1>
                {gameResponse && (
                  <p className="text-slate-400 mt-0.5 font-medium">
                    Round {gameResponse.current_round} {gameResponse.game_status === 'completed' ? '• Game Over!' : '• Live'}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={startNewGame}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 h-12 px-6 font-bold"
          >
            <RotateCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            New Game
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Current Question */}
        {gameResponse?.question && gameResponse.game_status === 'in_progress' && (
          <div className="mb-6 animate-in slide-in-from-top-4">
            <QuestionDisplay question={gameResponse.question} />
          </div>
        )}

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-240px)] min-h-[600px]">
          {/* Player 1 Panel */}
          <div className="h-full">
            <PlayerPanel
              playerName="Player 1"
              score={gameResponse?.scores.player1 || 0}
              isActive={isPlayer1Turn && gameResponse?.game_status === 'in_progress'}
              chatHistory={player1Chat}
              answer={player1Answer}
              onAnswerChange={setPlayer1Answer}
              onSubmit={() => submitAnswer('Player 1', player1Answer)}
              loading={loading}
              playerColor="blue-500"
              gradientFrom="from-blue-600"
              gradientTo="to-blue-500"
            />
          </div>

          {/* Center Leaderboard */}
          <div className="h-full flex flex-col gap-4">
            {gameResponse && (
              <LeaderboardPanel
                leaderboard={gameResponse.leaderboard}
                currentTurn={gameResponse.current_turn}
                currentRound={gameResponse.current_round}
              />
            )}

            {/* Game Message */}
            {gameResponse?.game_message && (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-center text-slate-300 leading-relaxed">
                    {gameResponse.game_message}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Player 2 Panel */}
          <div className="h-full">
            <PlayerPanel
              playerName="Player 2"
              score={gameResponse?.scores.player2 || 0}
              isActive={!isPlayer1Turn && gameResponse?.game_status === 'in_progress'}
              chatHistory={player2Chat}
              answer={player2Answer}
              onAnswerChange={setPlayer2Answer}
              onSubmit={() => submitAnswer('Player 2', player2Answer)}
              loading={loading}
              playerColor="orange-500"
              gradientFrom="from-orange-600"
              gradientTo="to-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      <Dialog open={showWinnerModal} onOpenChange={setShowWinnerModal}>
        <DialogContent className="bg-gradient-to-br from-purple-900 via-violet-900 to-blue-900 text-white border-2 border-purple-500/50 shadow-2xl max-w-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30 rounded-lg"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-center space-y-4 pt-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-yellow-500/50 animate-bounce">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Game Over!
                </h2>
                {gameResponse?.winner && (
                  <p className="text-2xl font-bold text-white mt-2">
                    {gameResponse.winner} Wins!
                  </p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 relative z-10">
            <Separator className="mb-6 bg-white/20" />
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-white/70 mb-4 uppercase tracking-wide text-sm font-bold">Final Scores</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-6 rounded-2xl shadow-xl border-2 border-blue-400/30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <User className="w-5 h-5" />
                      <p className="font-bold text-lg">Player 1</p>
                    </div>
                    <p className="text-4xl font-black">{gameResponse?.scores.player1 || 0}</p>
                    <p className="text-xs text-white/70 mt-1">points</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-600 to-orange-500 p-6 rounded-2xl shadow-xl border-2 border-orange-400/30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <User className="w-5 h-5" />
                      <p className="font-bold text-lg">Player 2</p>
                    </div>
                    <p className="text-4xl font-black">{gameResponse?.scores.player2 || 0}</p>
                    <p className="text-xs text-white/70 mt-1">points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="relative z-10">
            <Button
              onClick={() => {
                setShowWinnerModal(false)
                startNewGame()
              }}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-black text-lg h-14 rounded-xl shadow-xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105"
            >
              <RotateCw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
