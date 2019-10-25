import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import { Loading, Owner, IssueList, FilterList, Pagination } from './styles';
import Container from '../../components/Container';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filter: 'open',
    page: 1,
    lastPage: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'open',
          per_page: 5,
        },
      }),
    ]);

    let lastPage = 1;
    const issueLinks = issues.headers.link;

    if (issueLinks) {
      const pageLinks = issues.headers.link.split(',');
      [, lastPage] = pageLinks
        .find(link => link.match(/rel="last"$/i))
        .match(/page=(\d+)>/);
    }

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
      lastPage,
    });
  }

  async handleFilter(filter) {
    const { repository } = this.state;
    const repoName = repository.full_name;

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filter,
        per_page: 5,
      },
    });

    let lastPage = 1;
    const issueLinks = issues.headers.link;

    if (issueLinks) {
      const pageLinks = issues.headers.link.split(',');
      [, lastPage] = pageLinks
        .find(link => link.match(/rel="last"$/i))
        .match(/page=(\d+)>/);
    }

    this.setState({
      issues: issues.data,
      page: 1,
      lastPage,
      filter,
    });
  }

  async handlePaginate(page) {
    const { repository, filter } = this.state;
    const repoName = repository.full_name;

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filter,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: issues.data,
      page,
    });
  }

  render() {
    const { repository, issues, loading, filter, page, lastPage } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <FilterList>
            <button
              type="button"
              className={filter === 'open' ? 'active' : undefined}
              onClick={() => this.handleFilter('open')}
            >
              Abertas
            </button>
            <button
              type="button"
              className={filter === 'closed' ? 'active' : undefined}
              onClick={() => this.handleFilter('closed')}
            >
              Fechadas
            </button>
            <button
              type="button"
              className={filter === 'all' ? 'active' : undefined}
              onClick={() => this.handleFilter('all')}
            >
              Todas
            </button>
          </FilterList>

          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}

          {issues.length === 0 ? <p>Nenhuma issue encontrada</p> : undefined}

          <Pagination>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => this.handlePaginate(page - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page === parseInt(lastPage, 10)}
              onClick={() => this.handlePaginate(page + 1)}
            >
              Próxima
            </button>
          </Pagination>
        </IssueList>
      </Container>
    );
  }
}
