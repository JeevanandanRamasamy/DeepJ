# Contributing to DeepJ

Thank you for your interest in contributing to DeepJ! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (OS, Python version, camera type)
- Any error messages or logs

### Suggesting Enhancements

Enhancement suggestions are welcome! Please open an issue with:
- A clear description of the enhancement
- Use cases and benefits
- Any implementation ideas you have

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/DeepJ.git
   cd DeepJ
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up music directory:
   ```bash
   python setup.py
   ```

## Coding Guidelines

### Python Style
- Follow PEP 8 style guide
- Use meaningful variable and function names
- Add docstrings to classes and functions
- Keep functions focused and single-purpose

### Code Organization
- Keep modules focused on specific functionality
- Maintain separation of concerns
- Add comments for complex logic

### Testing
- Test your changes manually with different scenarios
- Ensure camera detection works in various lighting conditions
- Verify music playback with different file formats

## Areas for Contribution

### High Priority
- Multi-person mood detection and averaging
- Performance optimizations for older hardware
- Better error handling and recovery
- More mood categories and emotion mappings

### Medium Priority
- Web interface for remote monitoring
- Configuration file support
- Logging system
- Music playlist management

### Nice to Have
- Integration with Spotify/streaming services
- Mobile app support
- Custom mood training
- Analytics and mood history

## Code Review Process

1. All PRs require review before merging
2. Maintainers will provide feedback
3. Address review comments
4. Once approved, PR will be merged

## Questions?

Feel free to open an issue for questions or join discussions!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
