import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Trophy, RotateCw, Send, User } from 'lucide-react'
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
  playerColor
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
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory])

  return (
    <Card className={`flex flex-col h-full ${isActive ? `ring-4 ring-${playerColor} shadow-xl` : ''} transition-all duration-300`}>
      <CardHeader className={`bg-${playerColor} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <CardTitle className="text-lg">{playerName}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            {score} pts
          </Badge>
        </div>
        {isActive && (
          <Badge className="bg-green-500 text-white mt-2 animate-pulse">
            YOUR TURN
          </Badge>
        )}
        {!isActive && (
          <Badge variant="outline" className="mt-2 text-gray-400 border-gray-400">
            WAITING
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 gap-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className="space-y-1">
                {msg.type === 'question' && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Question:</p>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                )}
                {msg.type === 'answer' && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Your Answer:</p>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                )}
                {msg.type === 'result' && (
                  <div className={`p-3 rounded-lg ${msg.isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                    <p className={`text-sm font-semibold ${msg.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {msg.isCorrect ? 'Correct!' : 'Incorrect'}
                    </p>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="space-y-2">
          <Input
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={isActive ? "Type your answer..." : "Wait for your turn..."}
            disabled={!isActive || loading}
            className="w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isActive && !loading && answer.trim()) {
                onSubmit()
              }
            }}
          />
          <Button
            onClick={onSubmit}
            disabled={!isActive || loading || !answer.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
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
    <Card className="bg-gradient-to-br from-purple-900 to-purple-800 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-center">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Live Leaderboard
        </CardTitle>
        <p className="text-center text-sm text-purple-200">Round {currentRound}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.map((entry, idx) => {
          const isLeading = idx === 0 && leaderboard.length > 1 && entry.score > leaderboard[1].score
          const isActiveTurn = entry.player === currentTurn

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg transition-all duration-300 ${
                isActiveTurn ? 'bg-yellow-400 text-gray-900 ring-4 ring-yellow-300' : 'bg-purple-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isActiveTurn ? 'bg-gray-900 text-yellow-400' : 'bg-purple-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold">{entry.player}</p>
                    {isActiveTurn && (
                      <p className="text-xs font-semibold">ACTIVE</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isLeading && (
                    <Trophy className="w-5 h-5 text-yellow-300" />
                  )}
                  <p className="text-2xl font-bold">{entry.score}</p>
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
    <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <CardContent className="p-6">
        <div className="space-y-3">
          <Badge variant="secondary" className="bg-white text-purple-600 font-semibold">
            {question.category}
          </Badge>
          <p className="text-xl font-semibold leading-relaxed">
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Trivia Duel
            </h1>
            {gameResponse && (
              <p className="text-gray-400 mt-1">
                Round {gameResponse.current_round} {gameResponse.game_status === 'completed' ? '- Game Over!' : ''}
              </p>
            )}
          </div>
          <Button
            onClick={startNewGame}
            disabled={loading}
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto">
        {/* Current Question */}
        {gameResponse?.question && gameResponse.game_status === 'in_progress' && (
          <div className="mb-6">
            <QuestionDisplay question={gameResponse.question} />
          </div>
        )}

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-240px)]">
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
            />
          </div>

          {/* Center Leaderboard */}
          <div className="h-full">
            {gameResponse && (
              <LeaderboardPanel
                leaderboard={gameResponse.leaderboard}
                currentTurn={gameResponse.current_turn}
                currentRound={gameResponse.current_round}
              />
            )}

            {/* Game Message */}
            {gameResponse?.game_message && (
              <Card className="mt-4 bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-sm text-center text-gray-300">
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
            />
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      <Dialog open={showWinnerModal} onOpenChange={setShowWinnerModal}>
        <DialogContent className="bg-gradient-to-br from-purple-900 to-blue-900 text-white border-purple-500">
          <DialogHeader>
            <DialogTitle className="text-3xl text-center flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Game Over!
            </DialogTitle>
            <DialogDescription className="text-gray-200 text-center text-lg mt-4">
              {gameResponse?.winner && (
                <span className="text-yellow-400 font-bold text-2xl">
                  {gameResponse.winner} Wins!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Separator className="mb-6 bg-purple-500" />
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-300 mb-4">Final Scores:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500 p-4 rounded-lg">
                    <p className="font-semibold">Player 1</p>
                    <p className="text-3xl font-bold">{gameResponse?.scores.player1 || 0}</p>
                  </div>
                  <div className="bg-orange-500 p-4 rounded-lg">
                    <p className="font-semibold">Player 2</p>
                    <p className="text-3xl font-bold">{gameResponse?.scores.player2 || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowWinnerModal(false)
                startNewGame()
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
