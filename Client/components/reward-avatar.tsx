"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Trophy, ArrowUp, Flame, Plus, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface RewardAvatarProps {
  studentName?: string
  initialPoints?: number
  nextRewardAt?: number
  initialStreak?: number
  onPointsChange?: (points: number) => void
  onStreakChange?: (streak: number) => void
}

export default function RewardAvatar({
  studentName = "Alex",
  initialPoints = 75,
  nextRewardAt = 100,
  initialStreak = 3,
  onPointsChange,
  onStreakChange,
}: RewardAvatarProps) {
  const [isWaving, setIsWaving] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)
  const [points, setPoints] = useState(initialPoints)
  const [streak, setStreak] = useState(initialStreak)
  const [showPointsAnimation, setShowPointsAnimation] = useState(false)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)
  const [showStreakAlert, setShowStreakAlert] = useState(false)
  const [avatarLevel, setAvatarLevel] = useState(1) // Starting with icon_female_1.png

  // Check if streak needs attention (no activity in last 20 hours in this demo)
  const streakAtRisk = lastActivity && new Date().getTime() - lastActivity.getTime() > 20 * 60 * 60 * 1000

  const streakTips = [
    `You're on a ${streak}-day streak! Keep it up!`,
    "Don't break your streak! Complete an activity today!",
    `${streakAtRisk ? "⚠️ " : ""}Consistent practice leads to faster progress!`,
    "Your streak shows your dedication to learning!",
  ]

  const improvementTips = [
    "Complete your daily practice to earn more points!",
    "Try challenging yourself with harder exercises!",
    `You're only ${nextRewardAt - points} points away from your next reward!`,
    "Great job so far! Keep going!",
  ]

  // Combine tips based on context
  const tips = streakAtRisk ? [...streakTips, ...improvementTips] : [...improvementTips, ...streakTips]

  useEffect(() => {
    // Wave animation every 5 seconds
    const waveInterval = setInterval(() => {
      setIsWaving(true)
      setTimeout(() => setIsWaving(false), 1000)
    }, 5000)

    // Rotate through tips every 4 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 4000)

    return () => {
      clearInterval(waveInterval)
      clearInterval(tipInterval)
    }
  }, [tips.length])

  useEffect(() => {
    // Call the callback when points change
    if (onPointsChange) {
      onPointsChange(points)
    }
  }, [points, onPointsChange])

  useEffect(() => {
    // Call the callback when streak changes
    if (onStreakChange) {
      onStreakChange(streak)
    }
  }, [streak, onStreakChange])

  // Check if we need to show streak alert
  useEffect(() => {
    if (streakAtRisk) {
      setShowStreakAlert(true)
      const timer = setTimeout(() => setShowStreakAlert(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [streakAtRisk])

  const pointsPercentage = (points / nextRewardAt) * 100

  // Get the current avatar image based on level (1-5)
  const getAvatarImage = () => {
    // Ensure the level stays between 1-5 range
    const safeLevel = Math.min(Math.max(avatarLevel, 1), 5)
    return `/icon_female_${safeLevel}.png`
  }

  const addPoints = (amount: number) => {
    setShowPointsAnimation(true)
    setTimeout(() => {
      // Check if adding these points will reach or exceed the next reward
      const newPoints = points + amount
      if (newPoints >= nextRewardAt) {
        // Level up the avatar
        setAvatarLevel((current) => {
          // Only increment if we're not already at max level
          return current < 5 ? current + 1 : current
        })

        // Reset points for next reward cycle
        setPoints(newPoints - nextRewardAt)
      } else {
        setPoints(newPoints)
      }
      setShowPointsAnimation(false)
    }, 300)

    // Update last activity time
    setLastActivity(new Date())

    // Check if we need to update streak
    const now = new Date()
    if (!lastActivity || isNewDay(lastActivity, now)) {
      setStreak((prev) => prev + 1)
    }
  }

  // Check if the date is a new day compared to the last activity
  const isNewDay = (last: Date, current: Date) => {
    return (
      last.getDate() !== current.getDate() ||
      last.getMonth() !== current.getMonth() ||
      last.getFullYear() !== current.getFullYear()
    )
  }

  return (
    <div className="flex flex-col items-center max-w-xs mx-auto">
      {/* Streak alert */}
      <AnimatePresence>
        {showStreakAlert && (
          <motion.div
            className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-3 rounded mb-4 w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center">
              <Flame className="h-5 w-5 text-amber-500 mr-2" />
              <p className="text-sm font-medium">Don't break your streak! Complete an activity today.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech bubble */}
      <motion.div
        className="relative bg-white p-4 rounded-2xl shadow-md mb-4 w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.p
          className="text-center text-sm font-medium text-gray-700"
          key={currentTip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {tips[currentTip]}
        </motion.p>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-4 bg-white"></div>
      </motion.div>

      {/* Avatar and points display */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Avatar - made more rectangular in vertical direction */}
          <div className="w-28 h-36 bg-purple-100 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-purple-300">
            <Image
              src={getAvatarImage()}
              alt="Learning Buddy Avatar"
              width={100}
              height={130}
              className="object-contain"
              priority
            />
          </div>

          {/* Floating stars */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{
              y: [0, -5, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 2,
              repeatType: "reverse",
            }}
          >
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          </motion.div>

          <motion.div
            className="absolute -bottom-1 -left-2"
            animate={{
              y: [0, -3, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 1.5,
              repeatType: "reverse",
              delay: 0.5,
            }}
          >
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          </motion.div>

          {/* Points animation */}
          <AnimatePresence>
            {showPointsAnimation && (
              <motion.div
                className="absolute -top-8 right-0 flex items-center text-green-600 font-bold"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Plus className="h-3 w-3" />
                <span className="text-sm">5</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Name and points */}
        <h3 className="mt-3 font-bold text-purple-700">{studentName}</h3>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Image
                src={getAvatarImage()}
                alt="Trophy"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <span className="text-sm font-medium">{points} points</span>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          <div className="flex items-center gap-1">
            <Flame className={`h-4 w-4 ${streakAtRisk ? "text-gray-400" : "text-orange-500"}`} />
            <span className="text-sm font-medium">{streak} day streak</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <motion.div
            className="bg-purple-600 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pointsPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          ></motion.div>
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
          <ArrowUp className="h-3 w-3" />
          <span>{nextRewardAt - points} points to next reward</span>
        </div>

        {/* Activity buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2 w-full">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center justify-center gap-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            onClick={() => addPoints(5)}
          >
            <Award className="h-3 w-3" />
            <span>Complete Task</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="flex items-center justify-center gap-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            onClick={() => addPoints(10)}
          >
            <Star className="h-3 w-3" />
            <span>Daily Quiz</span>
          </Button>
        </div>

        {/* Level indicator */}
        <div className="mt-2 text-xs text-purple-600 font-medium">
          Level {avatarLevel}/5
        </div>
      </div>
    </div>
  )
}
