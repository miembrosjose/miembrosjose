"use client"

import { useEffect } from "react"
import { resetStorageIfOutdated } from "@/lib/safe-storage"

export function StorageMigrator() {
  useEffect(() => {
    resetStorageIfOutdated()
  }, [])

  return null
}
