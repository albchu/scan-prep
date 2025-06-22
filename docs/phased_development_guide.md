# Phased Development Guide for LLM

## Development Approach

### Phase Implementation Process

1. **Read the roadmap phase requirements** from `docs/dev_roadmap.md`
2. **Implement all deliverables** listed for the specific phase
3. **Ensure acceptance criteria** are met before considering phase complete
4. **Test functionality** - verify build, lint, type-check all pass
5. **Create phase summary document** following the template below

### Implementation Standards

- **Complete the phase fully** - implement all deliverables, not partial work
- **Follow existing patterns** - maintain architectural consistency with previous phases
- **Ensure quality gates pass** - TypeScript compilation, ESLint, build success
- **Test manually** - verify the implemented features work as expected
- **Create only necessary files** - avoid over-engineering or premature optimization

## Phase Summary Document Requirements

### Document Purpose
The phase summary document serves as a technical change log for PR review. It should be **concise, factual, and focused on explicit changes made**.

### Required Sections

#### 1. Phase Goals Achieved
- List each deliverable from the roadmap with ✅ checkmarks
- Use exact wording from the roadmap where possible

#### 2. Architecture Implementation
- Brief overview of any new architectural patterns introduced
- Technology stack additions or changes
- Process structure updates

#### 3. Files Created/Modified
Organized by category:
- **Configuration Files** - build, lint, type configs
- **Main Process** - Electron main process files  
- **Renderer Process** - React/UI files
- **Components** - New React components
- **Services** - Business logic implementations
- **Shared** - Cross-process shared code

For each file, include brief description of its purpose.

#### 4. Key Implementation Details
Technical specifics that a reviewer needs to understand:
- Security configurations
- UI/UX patterns implemented  
- Build pipeline changes
- API interfaces created
- Database schemas (if applicable)

#### 5. Current State
- **Functional Features** - what actually works now
- **Build Output** - bundle sizes, compilation results
- **Quality Gates Passing** - list of validations that pass

### What NOT to Include

- ❌ Justifications for existing technology choices already established
- ❌ Future planning or roadmap speculation  
- ❌ Essay-like explanations
- ❌ Marketing language or "selling" the implementation
- ❌ Risk mitigation discussions
- ❌ Performance speculation
- ❌ Conclusion sections

**Note**: Justifications for NEW technology additions are important technical details and should be included when introducing dependencies, libraries, or architectural patterns not previously used.

### Writing Style

- **Factual and technical** - state what was implemented
- **Concise** - use bullet points and short sentences
- **Specific** - include actual file names, function names, configurations
- **Measurable** - include build sizes, test results, counts

### Example Entry Format

```markdown
### Files Created
- `src/main/services/FileManager.ts` - Directory reading and file validation
- `src/renderer/components/FileExplorer/PathInput.tsx` - Directory path input with validation
- `src/renderer/components/FileExplorer/FileList.tsx` - Image file listing component
```

### Document Naming
Use format: `dev_summary_phase_X.md` where X is the phase number.

## Usage Instructions

When implementing a new phase:

1. Reference the roadmap for that specific phase
2. Implement all deliverables completely
3. Ensure all acceptance criteria are met
4. Verify the demo requirements work
5. Create the summary document following this template
6. Focus on technical changes, not opinions or justifications 