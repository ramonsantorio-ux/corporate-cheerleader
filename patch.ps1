$file = "src/pages/AutoAvaliacaoFit.tsx"
$content = Get-Content -Path $file -Raw
$content = $content.Replace(
    "import { Checkbox } from '@/components/ui/checkbox';",
    "import { Checkbox } from '@/components/ui/checkbox';`nimport { useSearchParams } from 'react-router-dom';"
)
$content = $content.Replace(
    "const { toast } = useToast();",
    "const { toast } = useToast();`n  const [searchParams] = useSearchParams();`n  const uidParam = searchParams.get('uid');`n`n  useEffect(() => {`n    if (uidParam) {`n      setSelectedFunc(uidParam);`n    }`n  }, [uidParam]);"
)
$content = $content.Replace(
    "<div>`n                  <Label className=`"text-base font-semibold`">Quem é você?</Label>",
    "{!uidParam && (`n                  <div>`n                    <Label className=`"text-base font-semibold`">Quem é você?</Label>"
)
$content = $content.Replace(
    "</SelectContent>`n                  </Select>`n                </div>",
    "</SelectContent>`n                  </Select>`n                </div>`n                )}"
)
Set-Content -Path $file -Value $content -NoNewline
