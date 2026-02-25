

## Substituição completa das metas no banco de dados

### Resumo

Vou excluir todas as metas atuais da tabela `goals` e inserir as novas metas conforme a planilha atualizada. As 6 metas são iguais para todos os cargos, mas os **pesos** variam.

### Dados extraídos da planilha

Todas as metas compartilham os mesmos valores de referência. A diferença está nos pesos:

```text
Descrição                                | Gerente | Coordenador | Supervisor | Encarregado
-----------------------------------------|---------|-------------|------------|------------
Aderência à Programação                  |   40    |     40      |     40     |     25
Eventos c/ ou s/ perda                   |   10    |     10      |     15     |     15
Custo Manutenção                         |   10    |     10      |     10     |     15
Atendimento Eventuais (%)                |   15    |     15      |     15     |     25
Atendimento Programação Preventivas (%)  |   20    |     20      |     15     |     10
Turnover                                 |    5    |      5      |      5     |     10
```

Gerente Operacional e Coordenador Operacional possuem metas **idênticas**.

### Etapas

1. **Excluir todas as metas existentes** da tabela `goals` (DELETE)
2. **Inserir 24 registros** (6 metas x 4 cargos) com os pesos corretos e valores de referência da planilha

### Detalhes técnicos

Serão usadas duas operações no banco de dados (via ferramenta de inserção/dados):

- `DELETE FROM goals;`
- `INSERT INTO goals (cargo, descricao, peso, muito_abaixo, abaixo, dentro, acima, muito_acima)` com os 24 registros

Nenhuma alteração de código será necessária, pois a página `Avaliacoes.tsx` já lê dinamicamente os cargos e metas do banco.

