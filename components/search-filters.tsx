'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function SearchFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        params.set('page', '1') // Reset page
        router.replace(`/?${params.toString()}`)
    }, 300)

    const handleTypeChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== 'all') {
            params.set('type', value)
        } else {
            params.delete('type')
        }
        params.set('page', '1')
        router.replace(`/?${params.toString()}`)
    }

    return (
        <div className="flex gap-4 mb-6">
            <Input
                placeholder="Tìm kiếm mã hồ sơ, tiêu đề..."
                className="max-w-sm"
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get('q')?.toString()}
            />
            <Select
                defaultValue={searchParams.get('type')?.toString() || 'all'}
                onValueChange={handleTypeChange}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Loại án" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Hình sự">Hình sự</SelectItem>
                    <SelectItem value="Dân sự">Dân sự</SelectItem>
                    <SelectItem value="Hành chính">Hành chính</SelectItem>
                    <SelectItem value="Kinh tế">Kinh tế</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
