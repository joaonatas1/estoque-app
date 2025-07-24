import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Search, Plus, Minus, Package, Mic, MicOff, Upload, FileSpreadsheet, Download, Tag, CheckSquare, Square, RefreshCw, Edit3, Check, X, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import './App.css'

function App() {
  // Função para formatar valores em formato brasileiro
  const formatarValor = (valor) => {
    if (valor >= 10000) {
      return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    } else {
      return `R$ ${valor.toFixed(2)}`
    }
  }
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState(['Geral', 'Eletrônicos', 'Periféricos', 'Informática', 'Gaming'])
  const [pesquisa, setPesquisa] = useState('')
  const [pesquisaCategoria, setPesquisaCategoria] = useState('')
  const [pesquisaCategoriaFiltro, setPesquisaCategoriaFiltro] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('')
  const [novoProduto, setNovoProduto] = useState('')
  const [novoValorUnitario, setNovoValorUnitario] = useState('')
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState(['Geral'])
  const [gravandoVoz, setGravandoVoz] = useState(false)
  const [filtroAtivo, setFiltroAtivo] = useState('todos') // 'todos', 'baixo', 'sem_estoque'
  const [produtosSelecionados, setProdutosSelecionados] = useState([])
  const [modoSelecaoMultipla, setModoSelecaoMultipla] = useState(false)
  const [categoriaParaAtribuir, setCategoriaParaAtribuir] = useState('')
  const [produtoEditandoValor, setProdutoEditandoValor] = useState(null)
  const [valorEdicao, setValorEdicao] = useState('')
  const [categoriaFiltroValor, setCategoriaFiltroValor] = useState('todas')
  const [produtoEditandoCategoria, setProdutoEditandoCategoria] = useState(null)
  const [categoriaEdicao, setCategoriaEdicao] = useState('')

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const produtosSalvos = localStorage.getItem('estoque-produtos')
    if (produtosSalvos) {
      const produtos = JSON.parse(produtosSalvos)
      // Migrar dados antigos para nova estrutura se necessário
      const produtosMigrados = produtos.map(produto => ({
        ...produto,
        categorias: produto.categorias || (produto.categoria ? [produto.categoria] : ['Geral']),
        valorUnitario: produto.valorUnitario || 0
      }))
      setProdutos(produtosMigrados)
      localStorage.setItem('estoque-produtos', JSON.stringify(produtosMigrados))
    } else {
      // Dados de exemplo para demonstração
      const produtosExemplo = [
        { 
          id: '1', 
          nome: 'Notebook Dell', 
          quantidade: 5, 
          categorias: ['Eletrônicos', 'Informática'], 
          valorUnitario: 2500.00 
        },
        { 
          id: '2', 
          nome: 'Mouse Logitech', 
          quantidade: 15, 
          categorias: ['Periféricos'], 
          valorUnitario: 45.90 
        },
        { 
          id: '3', 
          nome: 'Teclado Mecânico', 
          quantidade: 8, 
          categorias: ['Periféricos', 'Gaming'], 
          valorUnitario: 189.99 
        },
        { 
          id: '4', 
          nome: 'Monitor 24"', 
          quantidade: 3, 
          categorias: ['Eletrônicos', 'Informática'], 
          valorUnitario: 899.00 
        }
      ]
      setProdutos(produtosExemplo)
      localStorage.setItem('estoque-produtos', JSON.stringify(produtosExemplo))
    }
  }, [])

  // Salvar no localStorage sempre que produtos mudarem
  useEffect(() => {
    localStorage.setItem('estoque-produtos', JSON.stringify(produtos))
  }, [produtos])

  // Filtrar produtos baseado na pesquisa e filtro ativo
  const produtosFiltrados = produtos.filter(produto => {
    // Filtro por pesquisa
    const passaPesquisa = produto.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
                         (produto.categorias && produto.categorias.some(cat => 
                           cat.toLowerCase().includes(pesquisa.toLowerCase())
                         ))
    
    // Filtro por pesquisa de categoria
    const passaPesquisaCategoria = !pesquisaCategoriaFiltro || 
                                  (produto.categorias && produto.categorias.some(cat => 
                                    cat.toLowerCase().includes(pesquisaCategoriaFiltro.toLowerCase())
                                  ))
    
    // Filtro por estatística
    let passaFiltro = true
    switch (filtroAtivo) {
      case 'baixo':
        passaFiltro = produto.quantidade > 0 && produto.quantidade < 5
        break
      case 'sem_estoque':
        passaFiltro = produto.quantidade === 0
        break
      case 'todos':
      default:
        passaFiltro = true
        break
    }
    
    return passaPesquisa && passaPesquisaCategoria && passaFiltro
  })

  // Adicionar novo produto
  const adicionarProduto = () => {
    if (novoProduto.trim()) {
      const produto = {
        id: Date.now().toString(),
        nome: novoProduto.trim(),
        quantidade: 1,
        categorias: [...categoriasSelecionadas],
        valorUnitario: parseFloat(novoValorUnitario) || 0
      }
      setProdutos([...produtos, produto])
      setNovoProduto('')
      setNovoValorUnitario('')
      setCategoriasSelecionadas(['Geral'])
    }
  }

  // Atualizar quantidade do produto
  const atualizarQuantidade = (id, novaQuantidade) => {
    if (novaQuantidade >= 0) {
      setProdutos(produtos.map(produto =>
        produto.id === id ? { ...produto, quantidade: novaQuantidade } : produto
      ))
    }
  }

  // Remover produto com confirmação
  const removerProduto = (id) => {
    const produto = produtos.find(p => p.id === id)
    if (!produto) return
    
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o produto "${produto.nome}"?\n\nEsta ação não pode ser desfeita.`
    )
    
    if (confirmacao) {
      setProdutos(produtos.filter(produto => produto.id !== id))
      alert(`Produto "${produto.nome}" removido com sucesso!`)
    }
  }

  // Calcular total de itens
  const totalItens = produtos.reduce((total, produto) => total + produto.quantidade, 0)

  // Calcular valor total em estoque por categoria
  const calcularValorTotalPorCategoria = (categoria) => {
    if (categoria === 'todas') {
      return produtos.reduce((total, produto) => 
        total + (produto.quantidade * produto.valorUnitario), 0
      )
    }
    
    return produtos
      .filter(produto => produto.categorias && produto.categorias.includes(categoria))
      .reduce((total, produto) => 
        total + (produto.quantidade * produto.valorUnitario), 0
      )
  }

  const valorTotalEstoque = calcularValorTotalPorCategoria(categoriaFiltroValor)

  // Função para normalizar texto (remover acentos e converter para minúsculas)
  const normalizarTexto = (texto) => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  // Funções de Gerenciamento de Categorias
  const adicionarCategoria = () => {
    if (novaCategoria.trim() && !categorias.includes(novaCategoria.trim())) {
      setCategorias([...categorias, novaCategoria.trim()])
      setNovaCategoria('')
      alert(`Categoria "${novaCategoria.trim()}" adicionada com sucesso!`)
    } else if (categorias.includes(novaCategoria.trim())) {
      alert('Esta categoria já existe!')
    }
  }

  const removerCategoria = (categoria) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja remover a categoria "${categoria}"?\n\nTodos os produtos desta categoria terão ela removida de suas listas.`
    )
    
    if (confirmacao) {
      // Remover categoria de todos os produtos que a possuem
      setProdutos(produtos.map(produto => ({
        ...produto,
        categorias: produto.categorias.filter(cat => cat !== categoria).length > 0
          ? produto.categorias.filter(cat => cat !== categoria)
          : ['Geral']
      })))
      
      // Remover categoria da lista
      setCategorias(categorias.filter(cat => cat !== categoria))
      alert(`Categoria "${categoria}" removida com sucesso!`)
    }
  }

  const filtrarPorCategoria = (categoria) => {
    setPesquisa(categoria)
  }

  const editarCategoriaProduto = (produtoId, novaCategoria) => {
    setProdutos(produtos.map(produto =>
      produto.id === produtoId 
        ? { ...produto, categorias: [novaCategoria] }
        : produto
    ))
  }

  const adicionarCategoriaProduto = (produtoId, categoria) => {
    setProdutos(produtos.map(produto => {
      if (produto.id === produtoId) {
        const categorias = produto.categorias || []
        if (!categorias.includes(categoria)) {
          return { ...produto, categorias: [...categorias, categoria] }
        }
      }
      return produto
    }))
  }

  const removerCategoriaProduto = (produtoId, categoria) => {
    setProdutos(produtos.map(produto => {
      if (produto.id === produtoId) {
        const novasCategorias = produto.categorias.filter(cat => cat !== categoria)
        return { 
          ...produto, 
          categorias: novasCategorias.length > 0 ? novasCategorias : ['Geral']
        }
      }
      return produto
    }))
  }

  const editarValorUnitario = (produtoId, novoValor) => {
    setProdutos(produtos.map(produto =>
      produto.id === produtoId 
        ? { ...produto, valorUnitario: parseFloat(novoValor) || 0 }
        : produto
    ))
  }

  const iniciarEdicaoValor = (produtoId, valorAtual) => {
    setProdutoEditandoValor(produtoId)
    setValorEdicao(valorAtual.toString())
  }

  const confirmarEdicaoValor = (produtoId) => {
    const novoValor = parseFloat(valorEdicao) || 0
    editarValorUnitario(produtoId, novoValor)
    setProdutoEditandoValor(null)
    setValorEdicao('')
  }

  const cancelarEdicaoValor = () => {
    setProdutoEditandoValor(null)
    setValorEdicao('')
  }

  const iniciarEdicaoCategoria = (produtoId) => {
    setProdutoEditandoCategoria(produtoId)
  }

  const confirmarEdicaoCategoria = (produtoId, novaCategoria) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja alterar a categoria principal deste produto para "${novaCategoria}"?`
    )
    
    if (confirmacao) {
      setProdutos(produtos.map(produto => {
        if (produto.id === produtoId) {
          // Manter outras categorias, mas colocar a nova como primeira
          const categorias = produto.categorias || ['Geral']
          const novasCategorias = [novaCategoria, ...categorias.filter(cat => cat !== novaCategoria)]
          return { ...produto, categorias: novasCategorias }
        }
        return produto
      }))
      
      setProdutoEditandoCategoria(null)
      alert(`Categoria alterada para "${novaCategoria}" com sucesso!`)
    } else {
      setProdutoEditandoCategoria(null)
    }
  }

  const cancelarEdicaoCategoria = () => {
    setProdutoEditandoCategoria(null)
  }

  const excluirCategoriaDoproduto = (produtoId, categoriaParaExcluir) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir a categoria "${categoriaParaExcluir}" deste produto?`
    )
    
    if (confirmacao) {
      setProdutos(produtos.map(produto => {
        if (produto.id === produtoId) {
          const novasCategorias = produto.categorias.filter(cat => cat !== categoriaParaExcluir)
          // Se não sobrar nenhuma categoria, adicionar "Geral"
          if (novasCategorias.length === 0) {
            novasCategorias.push('Geral')
          }
          return { ...produto, categorias: novasCategorias }
        }
        return produto
      }))
      
      setProdutoEditandoCategoria(null)
      alert(`Categoria "${categoriaParaExcluir}" excluída com sucesso!`)
    } else {
      setProdutoEditandoCategoria(null)
    }
  }

  const excluirTodasCategorias = () => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir TODAS as categorias personalizadas?\n\nEsta ação irá:\n- Remover todas as categorias criadas por você\n- Manter apenas as categorias padrão (Geral, Eletrônicos, Periféricos, Informática, Gaming)\n- Alterar produtos que usam categorias personalizadas para "Geral"\n\nEsta ação não pode ser desfeita!`
    )
    
    if (confirmacao) {
      // Categorias padrão que não podem ser excluídas
      const categoriasPadrao = ['Geral', 'Eletrônicos', 'Periféricos', 'Informática', 'Gaming']
      
      // Resetar lista de categorias para apenas as padrão
      setCategorias(categoriasPadrao)
      
      // Atualizar produtos que usam categorias personalizadas
      setProdutos(produtos.map(produto => {
        const categoriasFiltradas = produto.categorias.filter(cat => categoriasPadrao.includes(cat))
        return {
          ...produto,
          categorias: categoriasFiltradas.length > 0 ? categoriasFiltradas : ['Geral']
        }
      }))
      
      alert('Todas as categorias personalizadas foram excluídas com sucesso!')
    }
  }

  const toggleSelecaoProduto = (produtoId) => {
    if (produtosSelecionados.includes(produtoId)) {
      setProdutosSelecionados(produtosSelecionados.filter(id => id !== produtoId))
    } else {
      setProdutosSelecionados([...produtosSelecionados, produtoId])
    }
  }

  const atribuirCategoriaMultipla = () => {
    if (!categoriaParaAtribuir || produtosSelecionados.length === 0) return
    
    const confirmacao = window.confirm(
      `Tem certeza que deseja adicionar a categoria "${categoriaParaAtribuir}" para ${produtosSelecionados.length} produto(s)?\n\nA categoria será adicionada às categorias existentes de cada produto.`
    )
    
    if (confirmacao) {
      setProdutos(produtos.map(produto => {
        if (produtosSelecionados.includes(produto.id)) {
          const categorias = produto.categorias || ['Geral']
          if (!categorias.includes(categoriaParaAtribuir)) {
            return { ...produto, categorias: [...categorias, categoriaParaAtribuir] }
          }
        }
        return produto
      }))
      
      setProdutosSelecionados([])
      setCategoriaParaAtribuir('')
      setModoSelecaoMultipla(false)
      alert(`Categoria "${categoriaParaAtribuir}" adicionada com sucesso para ${produtosSelecionados.length} produto(s)!`)
    }
  }

  const substituirCategoriaMultipla = () => {
    if (!categoriaParaAtribuir || produtosSelecionados.length === 0) return
    
    const confirmacao = window.confirm(
      `Tem certeza que deseja substituir TODAS as categorias por "${categoriaParaAtribuir}" para ${produtosSelecionados.length} produto(s)?\n\nEsta ação removerá todas as categorias existentes dos produtos selecionados.`
    )
    
    if (confirmacao) {
      setProdutos(produtos.map(produto =>
        produtosSelecionados.includes(produto.id)
          ? { ...produto, categorias: [categoriaParaAtribuir] }
          : produto
      ))
      
      setProdutosSelecionados([])
      setCategoriaParaAtribuir('')
      setModoSelecaoMultipla(false)
      alert(`Categorias substituídas com sucesso para ${produtosSelecionados.length} produto(s)!`)
    }
  }

  // Função para processar arquivo CSV
  const processarCSV = (arquivo) => {
    return new Promise((resolve, reject) => {
      Papa.parse(arquivo, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const produtosImportados = results.data.map((linha, index) => {
              // Mapear colunas específicas
              const colunaNome = Object.keys(linha).find(key => 
                normalizarTexto(key) === 'nome'
              )
              
              const colunaQuantidade = Object.keys(linha).find(key => 
                normalizarTexto(key) === 'quantidade'
              )

              const colunaValor = Object.keys(linha).find(key => 
                normalizarTexto(key) === 'valor'
              )

              const colunaCategoria = Object.keys(linha).find(key => 
                normalizarTexto(key) === 'categoria'
              )

              const colunaSubcategoria = Object.keys(linha).find(key => 
                normalizarTexto(key) === 'subcategoria'
              )

              if (!colunaNome || !linha[colunaNome]) {
                throw new Error(`Linha ${index + 1}: Coluna NOME não encontrada ou vazia`)
              }

              const nome = linha[colunaNome].toString().trim()
              const quantidade = parseInt(linha[colunaQuantidade] || 0)
              const valor = parseFloat(linha[colunaValor] || 0)
              const categoria = linha[colunaCategoria] ? linha[colunaCategoria].toString().trim() : 'Geral'
              const subcategoria = linha[colunaSubcategoria] ? linha[colunaSubcategoria].toString().trim() : ''

              if (!nome) {
                throw new Error(`Linha ${index + 1}: Nome do produto está vazio`)
              }

              if (isNaN(quantidade) || quantidade < 0) {
                throw new Error(`Linha ${index + 1}: Quantidade inválida para "${nome}"`)
              }

              if (isNaN(valor) || valor < 0) {
                throw new Error(`Linha ${index + 1}: Valor inválido para "${nome}"`)
              }

              // Criar array de categorias
              const categorias = [categoria]
              if (subcategoria && subcategoria !== categoria) {
                categorias.push(subcategoria)
              }

              return { nome, quantidade, valor, categorias }
            })
            resolve(produtosImportados)
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => reject(new Error(`Erro ao processar CSV: ${error.message}`))
      })
    })
  }

  // Função para processar arquivo XLSX
  const processarXLSX = (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          const produtosImportados = jsonData.map((linha, index) => {
            // Mapear colunas específicas
            const colunaNome = Object.keys(linha).find(key => 
              normalizarTexto(key) === 'nome'
            )
            
            const colunaQuantidade = Object.keys(linha).find(key => 
              normalizarTexto(key) === 'quantidade'
            )

            const colunaValor = Object.keys(linha).find(key => 
              normalizarTexto(key) === 'valor'
            )

            const colunaCategoria = Object.keys(linha).find(key => 
              normalizarTexto(key) === 'categoria'
            )

            const colunaSubcategoria = Object.keys(linha).find(key => 
              normalizarTexto(key) === 'subcategoria'
            )

            if (!colunaNome || !linha[colunaNome]) {
              throw new Error(`Linha ${index + 1}: Coluna NOME não encontrada ou vazia`)
            }

            const nome = linha[colunaNome].toString().trim()
            const quantidade = parseInt(linha[colunaQuantidade] || 0)
            const valor = parseFloat(linha[colunaValor] || 0)
            const categoria = linha[colunaCategoria] ? linha[colunaCategoria].toString().trim() : 'Geral'
            const subcategoria = linha[colunaSubcategoria] ? linha[colunaSubcategoria].toString().trim() : ''

            if (!nome) {
              throw new Error(`Linha ${index + 1}: Nome do produto está vazio`)
            }

            if (isNaN(quantidade) || quantidade < 0) {
              throw new Error(`Linha ${index + 1}: Quantidade inválida para "${nome}"`)
            }

            if (isNaN(valor) || valor < 0) {
              throw new Error(`Linha ${index + 1}: Valor inválido para "${nome}"`)
            }

            // Criar array de categorias
            const categorias = [categoria]
            if (subcategoria && subcategoria !== categoria) {
              categorias.push(subcategoria)
            }

            return { nome, quantidade, valor, categorias }
          })
          resolve(produtosImportados)
        } catch (error) {
          reject(new Error(`Erro ao processar XLSX: ${error.message}`))
        }
      }
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsArrayBuffer(arquivo)
    })
  }

  // Função para importar planilha
  const importarPlanilha = async (event) => {
    const arquivo = event.target.files[0]
    if (!arquivo) return

    const tipoArquivo = arquivo.name.split('.').pop().toLowerCase()
    
    if (!['csv', 'xlsx', 'xls'].includes(tipoArquivo)) {
      alert('Formato de arquivo não suportado. Use CSV ou XLSX.')
      return
    }

    try {
      let produtosImportados = []
      
      if (tipoArquivo === 'csv') {
        produtosImportados = await processarCSV(arquivo)
      } else {
        produtosImportados = await processarXLSX(arquivo)
      }

      // Processar produtos importados
      let produtosAtualizados = [...produtos]
      let novos = 0
      let atualizados = 0

      produtosImportados.forEach(({ nome, quantidade, valor, categorias }) => {
        // Normalizar nome para comparação
        const nomeNormalizado = normalizarTexto(nome)
        
        // Verificar se produto já existe (comparação normalizada)
        const produtoExistente = produtosAtualizados.find(p => 
          normalizarTexto(p.nome) === nomeNormalizado
        )

        if (produtoExistente) {
          // Atualizar produto existente
          produtoExistente.quantidade = quantidade
          produtoExistente.valorUnitario = valor
          produtoExistente.categorias = categorias
          atualizados++
        } else {
          // Criar novo produto
          const novoProduto = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            nome: nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase(),
            quantidade: quantidade,
            categorias: categorias,
            valorUnitario: valor
          }
          produtosAtualizados.push(novoProduto)
          novos++
        }
      })

      setProdutos(produtosAtualizados)
      alert(`Importação concluída!\n${novos} produtos novos adicionados\n${atualizados} produtos atualizados`)
      
      // Limpar input
      event.target.value = ''
    } catch (error) {
      console.error('Erro na importação:', error)
      alert(`Erro na importação: ${error.message}`)
    }
  }

  // Exportar estoque para XLSX
  const exportarXLSX = () => {
    if (produtos.length === 0) {
      alert('Não há produtos para exportar!')
      return
    }

    // Preparar dados para exportação
    const dadosExportacao = produtos.map(produto => {
      // Separar categoria principal e subcategoria
      const categoria = produto.categorias && produto.categorias.length > 0 ? produto.categorias[0] : 'Geral'
      const subcategoria = produto.categorias && produto.categorias.length > 1 ? produto.categorias[1] : ''

      return {
        NOME: produto.nome,
        QUANTIDADE: produto.quantidade,
        VALOR: produto.valorUnitario,
        CATEGORIA: categoria,
        SUBCATEGORIA: subcategoria
      }
    })

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(dadosExportacao)

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estoque')

    // Criar nome do arquivo com formato "ESTOQUE AMY - DD/MM/AA"
    const agora = new Date()
    const dia = String(agora.getDate()).padStart(2, '0')
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const ano = String(agora.getFullYear()).slice(-2)
    const nomeArquivo = `ESTOQUE AMY - ${dia}-${mes}-${ano}.xlsx`

    // Exportar arquivo
    XLSX.writeFile(workbook, nomeArquivo)
    
    alert(`Estoque exportado com sucesso!\nArquivo: ${nomeArquivo}`)
  }

  const iniciarGravacaoVoz = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Reconhecimento de voz não é suportado neste navegador. Use Chrome, Edge ou Safari.')
      return
    }

    if (gravandoVoz) {
      setGravandoVoz(false)
      return
    }

    // Solicitar permissão para microfone
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      alert('Permissão para microfone negada. Por favor, permita o acesso ao microfone e tente novamente.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setGravandoVoz(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase()
      processarComandoVoz(transcript)
    }

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento de voz:', event.error)
      setGravandoVoz(false)
      
      let mensagem = 'Erro no reconhecimento de voz.'
      switch(event.error) {
        case 'not-allowed':
          mensagem = 'Permissão para microfone negada. Permita o acesso ao microfone nas configurações do navegador.'
          break
        case 'no-speech':
          mensagem = 'Nenhuma fala detectada. Tente falar mais alto ou verificar o microfone.'
          break
        case 'audio-capture':
          mensagem = 'Erro ao capturar áudio. Verifique se o microfone está funcionando.'
          break
        case 'network':
          mensagem = 'Erro de rede. Verifique sua conexão com a internet.'
          break
        default:
          mensagem = `Erro no reconhecimento de voz: ${event.error}. Tente novamente.`
      }
      alert(mensagem)
    }

    recognition.onend = () => {
      setGravandoVoz(false)
    }

    try {
      recognition.start()
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento:', error)
      setGravandoVoz(false)
      alert('Erro ao iniciar reconhecimento de voz. Tente novamente.')
    }
  }

  // Processar comandos de voz
  const processarComandoVoz = (comando) => {
    console.log('Comando recebido:', comando)
    
    // Padrões de comando para adicionar produtos
    const padraoAdicionar = /adicionar (\d+)?\s*(.+)/i
    const padraoNovo = /novo produto (.+)/i
    const padraoQuantidade = /(\d+)\s*(.+)/i
    
    let match
    
    if ((match = comando.match(padraoAdicionar))) {
      const quantidade = parseInt(match[1]) || 1
      const nomeProduto = match[2].trim()
      adicionarProdutoVoz(nomeProduto, quantidade)
    } else if ((match = comando.match(padraoNovo))) {
      const nomeProduto = match[1].trim()
      adicionarProdutoVoz(nomeProduto, 1)
    } else if ((match = comando.match(padraoQuantidade))) {
      const quantidade = parseInt(match[1])
      const nomeProduto = match[2].trim()
      adicionarProdutoVoz(nomeProduto, quantidade)
    } else {
      // Se não reconhecer o padrão, adiciona como produto simples
      adicionarProdutoVoz(comando.trim(), 1)
    }
  }

  // Adicionar produto via comando de voz
  const adicionarProdutoVoz = (nome, quantidade) => {
    if (!nome) return
    
    // Verificar se produto já existe
    const produtoExistente = produtos.find(p => 
      p.nome.toLowerCase().includes(nome.toLowerCase()) || 
      nome.toLowerCase().includes(p.nome.toLowerCase())
    )
    
    if (produtoExistente) {
      // Atualizar quantidade do produto existente
      atualizarQuantidade(produtoExistente.id, produtoExistente.quantidade + quantidade)
      alert(`Adicionado ${quantidade} unidade(s) ao produto "${produtoExistente.nome}"`)
    } else {
      // Criar novo produto
      const produto = {
        id: Date.now().toString(),
        nome: nome.charAt(0).toUpperCase() + nome.slice(1),
        quantidade: quantidade,
        categoria: 'Geral'
      }
      setProdutos([...produtos, produto])
      alert(`Produto "${produto.nome}" adicionado com ${quantidade} unidade(s)`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Controle de Estoque AMY</h1>
          </div>
          <p className="text-gray-600">Gerencie seu estoque com facilidade usando pesquisa manual ou por voz</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${filtroAtivo === 'todos' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFiltroAtivo('todos')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                  <p className="text-3xl font-bold text-blue-600">{produtos.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${filtroAtivo === 'todos' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setFiltroAtivo('todos')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quantidade Total</p>
                  <p className="text-3xl font-bold text-green-600">{totalItens}</p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {totalItens}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${filtroAtivo === 'baixo' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => setFiltroAtivo('baixo')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {produtos.filter(p => p.quantidade > 0 && p.quantidade < 5).length}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1 border-yellow-500 text-yellow-600">
                  Baixo
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${filtroAtivo === 'sem_estoque' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setFiltroAtivo('sem_estoque')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sem Estoque</p>
                  <p className="text-3xl font-bold text-red-600">
                    {produtos.filter(p => p.quantidade === 0).length}
                  </p>
                </div>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  Falta
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Valor Total em Estoque */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Valor Total em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Filtro por Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Categoria
                </label>
                <select
                  value={categoriaFiltroValor}
                  onChange={(e) => setCategoriaFiltroValor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todas">Todas as Categorias</option>
                  {categorias.map((categoria, index) => (
                    <option key={index} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exibição do Valor Total */}
              <div className="text-center md:text-right">
                <div className="text-sm text-gray-600 mb-1">
                  {categoriaFiltroValor === 'todas' ? 'Valor Total Geral' : `Valor Total - ${categoriaFiltroValor}`}
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {formatarValor(valorTotalEstoque)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {categoriaFiltroValor === 'todas' 
                    ? `${produtos.length} produtos` 
                    : `${produtos.filter(p => p.categorias && p.categorias.includes(categoriaFiltroValor)).length} produtos`
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controles de Pesquisa e Adição */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Pesquisar e Adicionar Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Primeira linha - Pesquisa e Nome do Produto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Barra de Pesquisa */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Pesquisar produtos..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Nome do Produto */}
                <Input
                  placeholder="Nome do novo produto..."
                  value={novoProduto}
                  onChange={(e) => setNovoProduto(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && adicionarProduto()}
                />
              </div>

              {/* Segunda linha - Valor Unitário e Categorias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Valor Unitário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Unitário (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={novoValorUnitario}
                    onChange={(e) => setNovoValorUnitario(e.target.value)}
                  />
                </div>

                {/* Múltiplas Categorias */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categorias
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-2 border rounded-md bg-gray-50">
                      {categoriasSelecionadas.map((cat, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cat}
                          <button
                            onClick={() => {
                              const novasCategorias = categoriasSelecionadas.filter((_, i) => i !== index)
                              setCategoriasSelecionadas(novasCategorias.length > 0 ? novasCategorias : ['Geral'])
                            }}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value && !categoriasSelecionadas.includes(e.target.value)) {
                          setCategoriasSelecionadas([...categoriasSelecionadas, e.target.value])
                        }
                        e.target.value = ''
                      }}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="">Adicionar categoria...</option>
                      {categorias.filter(cat => !categoriasSelecionadas.includes(cat)).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Terceira linha - Botões de Ação */}
              <div className="flex gap-2 flex-wrap">
                <Button onClick={adicionarProduto} className="flex-1 min-w-[120px]">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
                <Button
                  variant={gravandoVoz ? "destructive" : "outline"}
                  onClick={iniciarGravacaoVoz}
                  className={`px-3 ${gravandoVoz ? 'animate-pulse' : ''}`}
                  title={gravandoVoz ? "Clique para parar gravação" : "Clique para gravar comando de voz"}
                >
                  {gravandoVoz ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                {/* Botão de Importação */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={importarPlanilha}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Importar planilha CSV ou XLSX"
                  />
                  <Button
                    variant="outline"
                    className="px-3"
                    title="Importar planilha CSV ou XLSX"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>

                {/* Botão de Exportação */}
                <Button
                  variant="outline"
                  onClick={exportarXLSX}
                  className="px-3"
                  title="Exportar estoque para XLSX"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Instruções de Voz */}
            {gravandoVoz && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm font-medium mb-2">🎤 Gravando... Diga um comando:</p>
                <ul className="text-blue-700 text-xs space-y-1">
                  <li>• "Adicionar 5 notebooks"</li>
                  <li>• "Novo produto teclado"</li>
                  <li>• "3 mouses"</li>
                  <li>• Ou apenas o nome do produto</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gerenciamento de Categorias */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Pesquisar e Adicionar Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Pesquisa de Categorias */}
              <div className="md:col-span-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Pesquisar categorias..."
                    value={pesquisaCategoria}
                    onChange={(e) => setPesquisaCategoria(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Adicionar Nova Categoria */}
              <div className="md:col-span-6">
                <Input
                  placeholder="Nome da nova categoria..."
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && adicionarCategoria()}
                />
              </div>

              {/* Botão Adicionar Categoria */}
              <div className="md:col-span-2">
                <Button onClick={adicionarCategoria} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Lista de Categorias */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {categorias
                  .filter(categoria => 
                    categoria.toLowerCase().includes(pesquisaCategoria.toLowerCase())
                  )
                  .map((categoria, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-100"
                      onClick={() => filtrarPorCategoria(categoria)}
                    >
                      {categoria}
                      {categoria !== 'Geral' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removerCategoria(categoria)
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))
                }
              </div>
            </div>

            {/* Seleção Múltipla e Atribuição de Categoria */}
            {modoSelecaoMultipla && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-800 font-medium">
                    {produtosSelecionados.length} produto(s) selecionado(s)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setModoSelecaoMultipla(false)
                      setProdutosSelecionados([])
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
                
                {produtosSelecionados.length > 0 && (
                  <div className="space-y-3">
                    <select
                      value={categoriaParaAtribuir}
                      onChange={(e) => setCategoriaParaAtribuir(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((categoria, index) => (
                        <option key={index} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button
                        onClick={atribuirCategoriaMultipla}
                        disabled={!categoriaParaAtribuir}
                        className="flex-1"
                        variant="default"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Categoria
                      </Button>
                      <Button
                        onClick={substituirCategoriaMultipla}
                        disabled={!categoriaParaAtribuir}
                        className="flex-1"
                        variant="outline"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Substituir Todas
                      </Button>
                      <Button
                        onClick={excluirTodasCategorias}
                        className="flex-1"
                        variant="destructive"
                        title="Excluir todas as categorias personalizadas"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir Todas
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">
                      <strong>Adicionar:</strong> Mantém categorias existentes e adiciona a nova<br/>
                      <strong>Substituir:</strong> Remove todas as categorias e define apenas a selecionada
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botão para ativar seleção múltipla */}
            {!modoSelecaoMultipla && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setModoSelecaoMultipla(true)}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Seleção Múltipla
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pesquisa por Categoria */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Pesquisar por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Digite o nome da categoria para filtrar produtos..."
                value={pesquisaCategoriaFiltro}
                onChange={(e) => setPesquisaCategoriaFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {pesquisaCategoriaFiltro && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>Filtrando por categoria:</strong> "{pesquisaCategoriaFiltro}"
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPesquisaCategoriaFiltro('')}
                  className="mt-2 text-xs"
                >
                  Limpar Filtro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {filtroAtivo === 'todos' && `Produtos em Estoque (${produtosFiltrados.length})`}
                {filtroAtivo === 'baixo' && `Produtos com Estoque Baixo (${produtosFiltrados.length})`}
                {filtroAtivo === 'sem_estoque' && `Produtos Sem Estoque (${produtosFiltrados.length})`}
              </span>
              {filtroAtivo !== 'todos' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltroAtivo('todos')}
                  className="text-xs"
                >
                  Mostrar Todos
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {produtosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {pesquisa ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {produtosFiltrados.map((produto) => (
                  <Card key={produto.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {/* Checkbox para seleção múltipla */}
                          {modoSelecaoMultipla && (
                            <button
                              onClick={() => toggleSelecaoProduto(produto.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {produtosSelecionados.includes(produto.id) ? (
                                <CheckSquare className="h-5 w-5" />
                              ) : (
                                <Square className="h-5 w-5" />
                              )}
                            </button>
                          )}
                          
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">{produto.nome}</h3>
                            
                            {/* Múltiplas categorias */}
                            <div className="mt-1 flex flex-wrap gap-1">
                              {produto.categorias && produto.categorias.map((categoria, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => iniciarEdicaoCategoria(produto.id)}
                                >
                                  {categoria}
                                </Badge>
                              ))}
                            </div>

                            {/* Menu de edição de categoria */}
                            {produtoEditandoCategoria === produto.id && (
                              <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                                <p className="text-xs text-blue-700 mb-2">Selecione uma opção:</p>
                                
                                {/* Alterar categoria */}
                                <div className="mb-2">
                                  <p className="text-xs text-blue-600 mb-1">Alterar categoria principal:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {categorias.map((categoria, index) => (
                                      <button
                                        key={index}
                                        onClick={() => confirmarEdicaoCategoria(produto.id, categoria)}
                                        className="px-2 py-1 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
                                      >
                                        {categoria}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Excluir categoria */}
                                <div className="mb-2">
                                  <p className="text-xs text-red-600 mb-1">Excluir categoria:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {produto.categorias.map((categoria, index) => (
                                      <button
                                        key={index}
                                        onClick={() => excluirCategoriaDoproduto(produto.id, categoria)}
                                        className="px-2 py-1 text-xs bg-red-50 border border-red-300 text-red-700 rounded hover:bg-red-100 transition-colors"
                                      >
                                        {categoria} ×
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <button
                                  onClick={cancelarEdicaoCategoria}
                                  className="mt-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                            
                            {/* Valor unitário e total */}
                            <div className="mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span>Valor unitário:</span>
                                {produtoEditandoValor === produto.id ? (
                                  <div className="flex items-center gap-1">
                                    <span>R$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={valorEdicao}
                                      onChange={(e) => setValorEdicao(e.target.value)}
                                      className="w-20 h-6 text-xs"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          confirmarEdicaoValor(produto.id)
                                        } else if (e.key === 'Escape') {
                                          cancelarEdicaoValor()
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => confirmarEdicaoValor(produto.id)}
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={cancelarEdicaoValor}
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span>R$ {produto.valorUnitario.toFixed(2)}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => iniciarEdicaoValor(produto.id, produto.valorUnitario)}
                                      className="h-5 w-5 p-0 text-gray-500 hover:text-blue-600"
                                      title="Editar valor unitário"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="font-semibold text-green-600">
                                Valor total: {formatarValor(produto.quantidade * produto.valorUnitario)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerProduto(produto.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => atualizarQuantidade(produto.id, produto.quantidade - 1)}
                            disabled={produto.quantidade === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="text-2xl font-bold text-blue-600 min-w-[3rem] text-center">
                            {produto.quantidade}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => atualizarQuantidade(produto.id, produto.quantidade + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Badge 
                          variant={produto.quantidade === 0 ? "destructive" : produto.quantidade < 5 ? "secondary" : "default"}
                        >
                          {produto.quantidade === 0 ? "Em Falta" : produto.quantidade < 5 ? "Baixo" : "OK"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App

